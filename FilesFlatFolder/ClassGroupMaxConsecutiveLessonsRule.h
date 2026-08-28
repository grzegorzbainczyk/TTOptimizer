#pragma once

#include <algorithm>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/ClassGroupSchedulingRuleSupport.h"

class ClassGroupMaxConsecutiveLessonsRule final : public IConstraintRule
{
public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        auto lowResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Low,
                "ClassGroupMaxConsecutiveLessons.Low",
                "Class group maximum consecutive lessons (Low)",
                "Counts lessons exceeding the configured maximum consecutive lesson limit.");

        auto mediumResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "ClassGroupMaxConsecutiveLessons.Medium",
                "Class group maximum consecutive lessons (Medium)",
                "Counts lessons exceeding the configured maximum consecutive lesson limit.");

        auto highResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "ClassGroupMaxConsecutiveLessons.High",
                "Class group maximum consecutive lessons (High)",
                "Counts lessons exceeding the configured maximum consecutive lesson limit.");

        auto hardResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "ClassGroupMaxConsecutiveLessons.Hard",
                "Class group maximum consecutive lessons (Hard)",
                "Counts lessons exceeding the configured maximum consecutive lesson limit.");

        for (const ClassGroupSchedulingPreference& preference :
            context.problem.classGroupSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.maxConsecutiveLessons;

            if (level ==
                SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            const auto classGroupIterator =
                context.classGroupScheduleStats.byClassGroup.find(
                    preference.classGroupId);

            if (classGroupIterator ==
                context.classGroupScheduleStats.byClassGroup.end())
            {
                continue;
            }

            for (int dayIndex = 0;
                dayIndex < context.problem.daysPerWeek;
                ++dayIndex)
            {
                const ClassGroupDayScheduleStats& stats =
                    classGroupIterator->second[
                        static_cast<std::size_t>(
                            dayIndex)];

                const int violationCount =
                    std::max(0, stats.maxConsecutiveLessons - preference.maxConsecutiveLessonsLimit);

                if (violationCount <= 0)
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

                target->violationCount +=
                    violationCount;

                if (level ==
                    SchedulingPreferenceLevel::Hard)
                {
                    ConstraintViolation violation;
                    violation.type =
                        ConstraintViolationType::ClassGroupMaxConsecutiveLessons;
                    violation.classGroupId =
                        preference.classGroupId;
                    violation.dayIndex =
                        dayIndex;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Class group exceeds the maximum consecutive lesson limit.";

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

        ClassGroupSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(lowResult));

        ClassGroupSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(mediumResult));

        ClassGroupSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(highResult));

        ClassGroupSchedulingRuleSupport::addResultIfViolated(
            results,
            std::move(hardResult));

        return results;
    }
};
