#pragma once

#include <unordered_map>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class SubjectPreferredRoomRule final : public IConstraintRule
{
public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        auto lowResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Low,
                "SubjectPreferredRoom.Low",
                "Prefer subject room (Low)",
                "Counts lessons assigned outside the subject's preferred room.");

        auto mediumResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "SubjectPreferredRoom.Medium",
                "Prefer subject room (Medium)",
                "Counts lessons assigned outside the subject's preferred room.");

        auto highResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "SubjectPreferredRoom.High",
                "Prefer subject room (High)",
                "Counts lessons assigned outside the subject's preferred room.");

        auto hardResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "SubjectPreferredRoom.Hard",
                "Require subject preferred room (Hard)",
                "Counts lessons assigned outside the subject's preferred room.");

        std::unordered_map<SubjectId, const SubjectSchedulingPreference*>
            preferenceBySubjectId;

        for (const SubjectSchedulingPreference& preference :
            context.problem.subjectSchedulingPreferences)
        {
            if (preference.preferredRoomId == 0 ||
                preference.preferredRoomImportance ==
                    SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            preferenceBySubjectId[preference.subjectId] =
                &preference;
        }

        std::unordered_map<LessonRequirementId, const LessonRequirement*>
            requirementById;

        for (const LessonRequirement& requirement :
            context.problem.lessonRequirements)
        {
            requirementById[requirement.id] = &requirement;
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

            const auto requirementIterator =
                requirementById.find(lessonInstance.requirementId);

            if (requirementIterator == requirementById.end())
            {
                continue;
            }

            const LessonRequirement& requirement =
                *requirementIterator->second;

            // A room configured directly on the lesson requirement is more
            // specific and therefore replaces the subject-level preference.
            if (requirement.preferredRoomId != 0 &&
                requirement.preferredRoomImportance !=
                    SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            const auto preferenceIterator =
                preferenceBySubjectId.find(requirement.subjectId);

            if (preferenceIterator == preferenceBySubjectId.end())
            {
                continue;
            }

            const SubjectSchedulingPreference& preference =
                *preferenceIterator->second;

            const ScheduleSlot& scheduleSlot =
                context.scheduleSlots[scheduleSlotIndex];

            if (scheduleSlot.roomId == preference.preferredRoomId)
            {
                continue;
            }

            ConstraintRuleResult* target =
                SubjectSchedulingRuleSupport::selectResult(
                    preference.preferredRoomImportance,
                    lowResult,
                    mediumResult,
                    highResult,
                    hardResult);

            if (target == nullptr)
            {
                continue;
            }

            ++target->violationCount;

            if (preference.preferredRoomImportance ==
                SchedulingPreferenceLevel::Hard)
            {
                ConstraintViolation violation;
                violation.type =
                    ConstraintViolationType::SubjectPreferredRoom;
                violation.studentGroupId =
                    requirement.studentGroupId;
                violation.subjectId =
                    requirement.subjectId;
                violation.roomId =
                    scheduleSlot.roomId;
                violation.message =
                    "Subject lesson is not assigned to its preferred room.";

                target->violations.push_back(
                    std::move(violation));
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
