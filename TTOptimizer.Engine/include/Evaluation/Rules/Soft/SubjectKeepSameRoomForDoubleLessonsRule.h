#pragma once

#include <algorithm>
#include <map>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class SubjectKeepSameRoomForDoubleLessonsRule final
    : public IConstraintRule
{
private:
    struct ScheduledOccurrence
    {
        int dayIndex{};
        int lessonNumber{};
        RoomId roomId{};
    };

public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        auto lowResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Low,
                "SubjectKeepSameRoomForDoubleLessons.Low",
                "Keep same room for subject double lessons (Low)",
                "Counts consecutive same-subject lessons for a student group that use different rooms.");

        auto mediumResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "SubjectKeepSameRoomForDoubleLessons.Medium",
                "Keep same room for subject double lessons (Medium)",
                "Counts consecutive same-subject lessons for a student group that use different rooms.");

        auto highResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "SubjectKeepSameRoomForDoubleLessons.High",
                "Keep same room for subject double lessons (High)",
                "Counts consecutive same-subject lessons for a student group that use different rooms.");

        auto hardResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "SubjectKeepSameRoomForDoubleLessons.Hard",
                "Keep same room for subject double lessons (Hard)",
                "Counts consecutive same-subject lessons for a student group that use different rooms.");

        std::map<
            StudentGroupSubjectKey,
            std::vector<ScheduledOccurrence>>
            occurrences;

        std::map<
            LessonRequirementId,
            StudentGroupSubjectKey>
            keyByRequirementId;

        for (const LessonRequirement& requirement :
            context.problem.lessonRequirements)
        {
            keyByRequirementId.emplace(
                requirement.id,
                StudentGroupSubjectKey{
                    requirement.studentGroupId,
                    requirement.subjectId
                });
        }

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

            const auto keyIterator =
                keyByRequirementId.find(
                    lessonInstance.requirementId);

            if (keyIterator == keyByRequirementId.end())
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                context.scheduleSlots[scheduleSlotIndex];

            occurrences[keyIterator->second].push_back(
                ScheduledOccurrence{
                    static_cast<int>(
                        scheduleSlot.timeSlot.day),
                    scheduleSlot.timeSlot.lessonNumber,
                    scheduleSlot.roomId
                });
        }

        for (const SubjectSchedulingPreference& preference :
            context.problem.subjectSchedulingPreferences)
        {
            /*
             * This rule deliberately follows preferDoubleLessons.
             * If a subject is not configured to prefer double lessons,
             * consecutive occurrences do not create a same-room requirement.
             */
            const SchedulingPreferenceLevel level =
                preference.preferDoubleLessons;

            if (level == SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            for (auto& [key, scheduled] : occurrences)
            {
                if (key.second != preference.subjectId)
                {
                    continue;
                }

                std::sort(
                    scheduled.begin(),
                    scheduled.end(),
                    [](const ScheduledOccurrence& first,
                       const ScheduledOccurrence& second)
                    {
                        return std::tie(
                            first.dayIndex,
                            first.lessonNumber)
                            <
                            std::tie(
                                second.dayIndex,
                                second.lessonNumber);
                    });

                int violationCount = 0;

                for (std::size_t index = 1;
                    index < scheduled.size();
                    ++index)
                {
                    const ScheduledOccurrence& previous =
                        scheduled[index - 1];

                    const ScheduledOccurrence& current =
                        scheduled[index];

                    const bool consecutive =
                        previous.dayIndex == current.dayIndex &&
                        previous.lessonNumber + 1 ==
                            current.lessonNumber;

                    if (!consecutive ||
                        previous.roomId == current.roomId)
                    {
                        continue;
                    }

                    ++violationCount;

                    if (level ==
                        SchedulingPreferenceLevel::Hard)
                    {
                        ConstraintViolation violation;
                        violation.type =
                            ConstraintViolationType::
                            SubjectKeepSameRoomForDoubleLessons;
                        violation.studentGroupId = key.first;
                        violation.subjectId = key.second;
                        violation.roomId = current.roomId;
                        violation.dayIndex = current.dayIndex;
                        violation.slotIndex =
                            current.lessonNumber;
                        violation.message =
                            "Consecutive subject lessons use different rooms.";

                        hardResult.violations.push_back(
                            std::move(violation));
                    }
                }

                if (violationCount <= 0)
                {
                    continue;
                }

                ConstraintRuleResult* target =
                    SubjectSchedulingRuleSupport::selectResult(
                        level,
                        lowResult,
                        mediumResult,
                        highResult,
                        hardResult);

                if (target == nullptr)
                {
                    continue;
                }

                target->violationCount += violationCount;
            }
        }

        lowResult.penalty =
            static_cast<double>(
                lowResult.violationCount) *
            context.problem.optimizationSettings.penalties.low;

        mediumResult.penalty =
            static_cast<double>(
                mediumResult.violationCount) *
            context.problem.optimizationSettings.penalties.medium;

        highResult.penalty =
            static_cast<double>(
                highResult.violationCount) *
            context.problem.optimizationSettings.penalties.high;

        SubjectSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(lowResult));

        SubjectSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(mediumResult));

        SubjectSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(highResult));

        SubjectSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(hardResult));

        return results;
    }
};
