#pragma once

#include <algorithm>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class SubjectAvoidDoubleLessonsRule final : public IConstraintRule
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
                "SubjectAvoidDoubleLessons.Low",
                "Avoid subject double lessons (Low)",
                "Counts adjacent same-subject lesson pairs for each class.");

        auto mediumResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "SubjectAvoidDoubleLessons.Medium",
                "Avoid subject double lessons (Medium)",
                "Counts adjacent same-subject lesson pairs for each class.");

        auto highResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "SubjectAvoidDoubleLessons.High",
                "Avoid subject double lessons (High)",
                "Counts adjacent same-subject lesson pairs for each class.");

        auto hardResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "SubjectAvoidDoubleLessons.Hard",
                "Avoid subject double lessons (Hard)",
                "Counts adjacent same-subject lesson pairs for each class.");

        for (const SubjectSchedulingPreference& preference :
            context.problem.subjectSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.avoidDoubleLessons;

            if (level == SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            for (const auto& [key, stats] :
                context.subjectScheduleStats.byClassGroupAndSubject)
            {
                if (key.second != preference.subjectId)
                {
                    continue;
                }

                int violationCount = 0;

                for (const auto& dayStats : stats.days)
                {
                    violationCount +=
                        dayStats.adjacentPairCount;
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

                target->violationCount +=
                    violationCount;

                if (level == SchedulingPreferenceLevel::Hard)
                {
                    ConstraintViolation violation;
                    violation.type =
                        ConstraintViolationType::
                        SubjectAvoidDoubleLessons;
                    violation.classGroupId =
                        key.first;
                    violation.subjectId =
                        key.second;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Subject has adjacent lessons that should be avoided.";

                    target->violations.push_back(
                        std::move(violation));
                }
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
