#pragma once

#include <algorithm>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/TeacherSchedulingRuleSupport.h"

class TeacherMaxLessonsPerDayRule final : public IConstraintRule
{
public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        auto lowResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Low,
                "TeacherMaxLessonsPerDay.Low",
                "Teacher maximum lessons per day (Low)",
                "Counts lessons exceeding the configured daily lesson limit.");

        auto mediumResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "TeacherMaxLessonsPerDay.Medium",
                "Teacher maximum lessons per day (Medium)",
                "Counts lessons exceeding the configured daily lesson limit.");

        auto highResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "TeacherMaxLessonsPerDay.High",
                "Teacher maximum lessons per day (High)",
                "Counts lessons exceeding the configured daily lesson limit.");

        auto hardResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "TeacherMaxLessonsPerDay.Hard",
                "Teacher maximum lessons per day (Hard)",
                "Counts lessons exceeding the configured daily lesson limit.");

        for (const TeacherSchedulingPreference& preference :
            context.problem.teacherSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.maxLessonsPerDay;

            if (level ==
                SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            const auto teacherIterator =
                context.teacherScheduleStats.byTeacher.find(
                    preference.teacherId);

            if (teacherIterator ==
                context.teacherScheduleStats.byTeacher.end())
            {
                continue;
            }

            for (int dayIndex = 0;
                dayIndex < context.problem.daysPerWeek;
                ++dayIndex)
            {
                const TeacherDayScheduleStats& stats =
                    teacherIterator->second[
                        static_cast<std::size_t>(
                            dayIndex)];

                const int violationCount =
                    std::max(0, stats.lessonCount - preference.maxLessonsPerDayLimit);

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
                        ConstraintViolationType::TeacherMaxLessonsPerDay;
                    violation.teacherId =
                        preference.teacherId;
                    violation.dayIndex =
                        dayIndex;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Teacher exceeds the maximum lessons per day limit.";

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
