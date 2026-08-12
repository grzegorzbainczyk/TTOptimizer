#pragma once

#include <algorithm>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class SubjectMaxOccurrencesPerDayRule final : public IConstraintRule
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
                "SubjectMaxOccurrencesPerDay.Low",
                "Subject maximum occurrences per day (Low)",
                "Counts subject lessons exceeding the configured per-day limit for each class.");

        auto mediumResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "SubjectMaxOccurrencesPerDay.Medium",
                "Subject maximum occurrences per day (Medium)",
                "Counts subject lessons exceeding the configured per-day limit for each class.");

        auto highResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "SubjectMaxOccurrencesPerDay.High",
                "Subject maximum occurrences per day (High)",
                "Counts subject lessons exceeding the configured per-day limit for each class.");

        auto hardResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "SubjectMaxOccurrencesPerDay.Hard",
                "Subject maximum occurrences per day (Hard)",
                "Counts subject lessons exceeding the configured per-day limit for each class.");

        for (const SubjectSchedulingPreference& preference :
            context.problem.subjectSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.maxOccurrencesPerDay;

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

                for (int dayIndex = 0;
                    dayIndex < context.problem.daysPerWeek;
                    ++dayIndex)
                {
                    const auto& dayStats =
                        stats.days[
                            static_cast<std::size_t>(
                                dayIndex)];

                    const int violationCount =
                        std::max(
                            0,
                            dayStats.lessonCount -
                            preference.maxOccurrencesPerDayLimit);

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
                            SubjectMaxOccurrencesPerDay;
                        violation.classGroupId =
                            key.first;
                        violation.subjectId =
                            key.second;
                        violation.dayIndex =
                            dayIndex;
                        violation.occurrenceCount =
                            violationCount;
                        violation.message =
                            "Subject exceeds the maximum occurrences per day limit.";

                        target->violations.push_back(
                            std::move(violation));
                    }
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
