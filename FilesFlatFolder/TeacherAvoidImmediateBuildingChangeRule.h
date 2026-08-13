#pragma once

#include <map>
#include <tuple>
#include <unordered_map>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/TeacherSchedulingRuleSupport.h"

class TeacherAvoidImmediateBuildingChangeRule final : public IConstraintRule
{
private:
    struct TeacherSlotKey
    {
        TeacherId teacherId{};
        int dayIndex{};
        int slotIndex{};

        bool operator<(const TeacherSlotKey& other) const
        {
            return std::tie(teacherId, dayIndex, slotIndex) <
                std::tie(other.teacherId, other.dayIndex, other.slotIndex);
        }
    };

    struct SlotBuildingAssignment
    {
        BuildingId buildingId{};
        RoomId roomId{};
        bool hasKnownBuilding{};
        bool ambiguous{};
    };

public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        auto lowResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Low,
                "TeacherAvoidImmediateBuildingChange.Low",
                "Avoid immediate teacher building change (Low)",
                "Counts consecutive teacher lessons assigned to rooms in different buildings.");

        auto mediumResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "TeacherAvoidImmediateBuildingChange.Medium",
                "Avoid immediate teacher building change (Medium)",
                "Counts consecutive teacher lessons assigned to rooms in different buildings.");

        auto highResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "TeacherAvoidImmediateBuildingChange.High",
                "Avoid immediate teacher building change (High)",
                "Counts consecutive teacher lessons assigned to rooms in different buildings.");

        auto hardResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "TeacherAvoidImmediateBuildingChange.Hard",
                "Avoid immediate teacher building change (Hard)",
                "Counts consecutive teacher lessons assigned to rooms in different buildings.");

        std::unordered_map<LessonRequirementId, TeacherId>
            teacherByRequirementId;

        for (const LessonRequirement& requirement :
            context.problem.lessonRequirements)
        {
            teacherByRequirementId.emplace(
                requirement.id,
                requirement.teacherId);
        }

        std::unordered_map<RoomId, BuildingId> buildingByRoomId;

        for (const Room& room : context.problem.rooms)
        {
            buildingByRoomId.emplace(room.id, room.buildingId);
        }

        std::map<TeacherSlotKey, SlotBuildingAssignment>
            assignments;

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

            const auto teacherIterator =
                teacherByRequirementId.find(
                    lessonInstance.requirementId);

            if (teacherIterator == teacherByRequirementId.end())
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                context.scheduleSlots[scheduleSlotIndex];

            const auto buildingIterator =
                buildingByRoomId.find(scheduleSlot.roomId);

            if (buildingIterator == buildingByRoomId.end() ||
                buildingIterator->second <= 0)
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

            const TeacherSlotKey key{
                teacherIterator->second,
                dayIndex,
                slotIndex
            };

            SlotBuildingAssignment& assignment =
                assignments[key];

            if (!assignment.hasKnownBuilding)
            {
                assignment.buildingId =
                    buildingIterator->second;
                assignment.roomId = scheduleSlot.roomId;
                assignment.hasKnownBuilding = true;
                continue;
            }

            if (assignment.buildingId !=
                buildingIterator->second)
            {
                // A teacher collision in multiple buildings is already
                // a hard conflict elsewhere. Do not multiply that error
                // into artificial transition violations.
                assignment.ambiguous = true;
            }
        }

        for (const TeacherSchedulingPreference& preference :
            context.problem.teacherSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.avoidImmediateBuildingChange;

            if (level == SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            for (int dayIndex = 0;
                dayIndex < context.problem.daysPerWeek;
                ++dayIndex)
            {
                for (int slotIndex = 0;
                    slotIndex + 1 < context.problem.slotsPerDay;
                    ++slotIndex)
                {
                    const TeacherSlotKey firstKey{
                        preference.teacherId,
                        dayIndex,
                        slotIndex
                    };

                    const TeacherSlotKey secondKey{
                        preference.teacherId,
                        dayIndex,
                        slotIndex + 1
                    };

                    const auto firstIterator =
                        assignments.find(firstKey);
                    const auto secondIterator =
                        assignments.find(secondKey);

                    if (firstIterator == assignments.end() ||
                        secondIterator == assignments.end())
                    {
                        // A free lesson slot between buildings is enough
                        // for this first, deliberately simple rule.
                        continue;
                    }

                    const SlotBuildingAssignment& first =
                        firstIterator->second;
                    const SlotBuildingAssignment& second =
                        secondIterator->second;

                    if (!first.hasKnownBuilding ||
                        !second.hasKnownBuilding ||
                        first.ambiguous ||
                        second.ambiguous ||
                        first.buildingId == second.buildingId)
                    {
                        continue;
                    }

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
                        continue;
                    }

                    ++target->violationCount;

                    if (level == SchedulingPreferenceLevel::Hard)
                    {
                        ConstraintViolation violation;
                        violation.type = ConstraintViolationType::
                            TeacherImmediateBuildingChange;
                        violation.teacherId = preference.teacherId;
                        violation.roomId = second.roomId;
                        violation.dayIndex = dayIndex;
                        violation.slotIndex = slotIndex + 1;
                        violation.occurrenceCount = 1;
                        violation.message =
                            "Teacher has consecutive lessons in different buildings.";

                        target->violations.push_back(
                            std::move(violation));
                    }
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

        TeacherSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(lowResult));

        TeacherSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(mediumResult));

        TeacherSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(highResult));

        TeacherSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(hardResult));

        return results;
    }
};
