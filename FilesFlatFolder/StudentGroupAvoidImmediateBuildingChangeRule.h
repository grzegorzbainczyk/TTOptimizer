#pragma once

#include <algorithm>
#include <cmath>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"

class StudentGroupAvoidImmediateBuildingChangeRule final
    : public IConstraintRule
{
private:
    struct Assignment
    {
        StudentGroupId studentGroupId{};
        BuildingId buildingId{};
        RoomId roomId{};
        int dayIndex{};
        int slotIndex{};
    };

    static bool studentGroupsConflict(
        const TimetableProblem& problem,
        StudentGroupId firstId,
        StudentGroupId secondId)
    {
        if (firstId <= 0 || secondId <= 0)
        {
            return false;
        }

        if (firstId == secondId)
        {
            return true;
        }

        return std::any_of(
            problem.studentGroupConflicts.begin(),
            problem.studentGroupConflicts.end(),
            [firstId, secondId](
                const StudentGroupConflict& conflict)
            {
                return
                    (conflict.firstStudentGroupId == firstId &&
                     conflict.secondStudentGroupId == secondId)
                    ||
                    (conflict.firstStudentGroupId == secondId &&
                     conflict.secondStudentGroupId == firstId);
            });
    }

    static ConstraintRuleResult createResult(
        ConstraintRuleKind kind,
        ConstraintPenaltyLevel penaltyLevel,
        std::string code,
        std::string name)
    {
        ConstraintRuleResult result;
        result.kind = kind;

        // StudentGroup does not yet have its own category in the
        // shared result model, so ClassGroup is the closest category.
        result.category = ConstraintRuleCategory::ClassGroup;

        result.penaltyLevel = penaltyLevel;
        result.code = std::move(code);
        result.name = std::move(name);
        result.description =
            "Counts consecutive lessons for overlapping student groups "
            "assigned to rooms in different buildings.";
        return result;
    }

    static void addIfViolated(
        std::vector<ConstraintRuleResult>& results,
        ConstraintRuleResult result)
    {
        if (result.violationCount > 0)
        {
            results.push_back(std::move(result));
        }
    }

public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        const SchedulingPreferenceLevel level =
            context.problem.studentGroupAvoidImmediateBuildingChange;

        if (level == SchedulingPreferenceLevel::Disabled)
        {
            return results;
        }

        std::vector<Assignment> assignments;
        assignments.reserve(context.chromosome.genes.size());

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < context.chromosome.genes.size();
            ++lessonIndex)
        {
            if (lessonIndex >= context.lessonInstances.size())
            {
                continue;
            }

            const ScheduleSlotIndex scheduleSlotIndex =
                context.chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= context.scheduleSlots.size())
            {
                continue;
            }

            const LessonInstance& lessonInstance =
                context.lessonInstances[lessonIndex];

            const auto requirementIterator =
                std::find_if(
                    context.problem.lessonRequirements.begin(),
                    context.problem.lessonRequirements.end(),
                    [&lessonInstance](
                        const LessonRequirement& requirement)
                    {
                        return requirement.id ==
                            lessonInstance.requirementId;
                    });

            if (requirementIterator ==
                context.problem.lessonRequirements.end() ||
                requirementIterator->studentGroupId <= 0)
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                context.scheduleSlots[scheduleSlotIndex];

            const auto roomIterator =
                std::find_if(
                    context.problem.rooms.begin(),
                    context.problem.rooms.end(),
                    [&scheduleSlot](const Room& room)
                    {
                        return room.id == scheduleSlot.roomId;
                    });

            if (roomIterator == context.problem.rooms.end() ||
                roomIterator->buildingId <= 0)
            {
                // Missing building data is intentionally ignored.
                continue;
            }

            const int dayIndex =
                static_cast<int>(scheduleSlot.timeSlot.day);

            const int slotIndex =
                scheduleSlot.timeSlot.lessonNumber;

            if (dayIndex < 0 ||
                dayIndex >= context.problem.daysPerWeek ||
                slotIndex < 0 ||
                slotIndex >= context.problem.slotsPerDay)
            {
                continue;
            }

            assignments.push_back(
                Assignment{
                    requirementIterator->studentGroupId,
                    roomIterator->buildingId,
                    scheduleSlot.roomId,
                    dayIndex,
                    slotIndex
                });
        }

        auto lowResult = createResult(
            ConstraintRuleKind::Soft,
            ConstraintPenaltyLevel::Low,
            "StudentGroupAvoidImmediateBuildingChange.Low",
            "Avoid immediate student-group building change (Low)");

        auto mediumResult = createResult(
            ConstraintRuleKind::Soft,
            ConstraintPenaltyLevel::Medium,
            "StudentGroupAvoidImmediateBuildingChange.Medium",
            "Avoid immediate student-group building change (Medium)");

        auto highResult = createResult(
            ConstraintRuleKind::Soft,
            ConstraintPenaltyLevel::High,
            "StudentGroupAvoidImmediateBuildingChange.High",
            "Avoid immediate student-group building change (High)");

        auto hardResult = createResult(
            ConstraintRuleKind::Hard,
            ConstraintPenaltyLevel::Hard,
            "StudentGroupAvoidImmediateBuildingChange.Hard",
            "Avoid immediate student-group building change (Hard)");

        ConstraintRuleResult* target = nullptr;

        switch (level)
        {
        case SchedulingPreferenceLevel::Low:
            target = &lowResult;
            break;
        case SchedulingPreferenceLevel::Medium:
            target = &mediumResult;
            break;
        case SchedulingPreferenceLevel::High:
            target = &highResult;
            break;
        case SchedulingPreferenceLevel::Hard:
            target = &hardResult;
            break;
        case SchedulingPreferenceLevel::Disabled:
            break;
        }

        if (target == nullptr)
        {
            return {};
        }

        for (std::size_t firstIndex = 0;
            firstIndex < assignments.size();
            ++firstIndex)
        {
            for (std::size_t secondIndex = firstIndex + 1;
                secondIndex < assignments.size();
                ++secondIndex)
            {
                const Assignment& first =
                    assignments[firstIndex];

                const Assignment& second =
                    assignments[secondIndex];

                if (first.dayIndex != second.dayIndex)
                {
                    continue;
                }

                if (std::abs(first.slotIndex - second.slotIndex) != 1)
                {
                    continue;
                }

                if (first.buildingId == second.buildingId)
                {
                    continue;
                }

                if (!studentGroupsConflict(
                    context.problem,
                    first.studentGroupId,
                    second.studentGroupId))
                {
                    continue;
                }

                ++target->violationCount;

                if (level == SchedulingPreferenceLevel::Hard)
                {
                    const Assignment& later =
                        first.slotIndex > second.slotIndex
                            ? first
                            : second;

                    ConstraintViolation violation;
                    violation.type =
                        ConstraintViolationType::
                            StudentGroupImmediateBuildingChange;
                    violation.studentGroupId =
                        first.studentGroupId;
                    violation.otherStudentGroupId =
                        second.studentGroupId;
                    violation.roomId = later.roomId;
                    violation.dayIndex = later.dayIndex;
                    violation.slotIndex = later.slotIndex;
                    violation.occurrenceCount = 1;
                    violation.message =
                        "Overlapping student groups have consecutive "
                        "lessons in different buildings.";

                    target->violations.push_back(
                        std::move(violation));
                }
            }
        }

        lowResult.penalty =
            static_cast<double>(lowResult.violationCount) *
            context.problem.optimizationSettings.penalties.low;

        mediumResult.penalty =
            static_cast<double>(mediumResult.violationCount) *
            context.problem.optimizationSettings.penalties.medium;

        highResult.penalty =
            static_cast<double>(highResult.violationCount) *
            context.problem.optimizationSettings.penalties.high;

        addIfViolated(results, std::move(lowResult));
        addIfViolated(results, std::move(mediumResult));
        addIfViolated(results, std::move(highResult));
        addIfViolated(results, std::move(hardResult));

        return results;
    }
};
