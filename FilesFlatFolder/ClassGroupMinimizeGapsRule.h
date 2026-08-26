#pragma once

#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/ClassGroupSchedulingRuleSupport.h"

class ClassGroupMinimizeGapsRule final : public IConstraintRule
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
                "ClassGroupMinimizeGaps.Low",
                "Minimize class group gaps (Low)",
                "Counts empty lesson slots between a class group's first and last lesson of the day.");

        auto mediumResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "ClassGroupMinimizeGaps.Medium",
                "Minimize class group gaps (Medium)",
                "Counts empty lesson slots between a class group's first and last lesson of the day.");

        auto highResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "ClassGroupMinimizeGaps.High",
                "Minimize class group gaps (High)",
                "Counts empty lesson slots between a class group's first and last lesson of the day.");

        auto hardResult =
            ClassGroupSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "ClassGroupMinimizeGaps.Hard",
                "Minimize class group gaps (Hard)",
                "Counts empty lesson slots between a class group's first and last lesson of the day.");

        for (const ClassGroupSchedulingPreference& preference :
            context.problem.classGroupSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.minimizeGaps;

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
                    (stats.lessonCount <= 1 ? 0 : (stats.lastSlot - stats.firstSlot + 1 - stats.lessonCount));

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
                        ConstraintViolationType::ClassGroupGap;
                    violation.classGroupId =
                        preference.classGroupId;
                    violation.dayIndex =
                        dayIndex;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Class group has gaps between lessons.";

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
