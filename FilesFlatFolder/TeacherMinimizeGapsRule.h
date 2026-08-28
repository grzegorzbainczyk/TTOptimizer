#pragma once

#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/TeacherSchedulingRuleSupport.h"

class TeacherMinimizeGapsRule final : public IConstraintRule
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
                "TeacherMinimizeGaps.Low",
                "Minimize teacher gaps (Low)",
                "Counts empty lesson slots between a teacher's first and last lesson of the day.");

        auto mediumResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "TeacherMinimizeGaps.Medium",
                "Minimize teacher gaps (Medium)",
                "Counts empty lesson slots between a teacher's first and last lesson of the day.");

        auto highResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "TeacherMinimizeGaps.High",
                "Minimize teacher gaps (High)",
                "Counts empty lesson slots between a teacher's first and last lesson of the day.");

        auto hardResult =
            TeacherSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "TeacherMinimizeGaps.Hard",
                "Minimize teacher gaps (Hard)",
                "Counts empty lesson slots between a teacher's first and last lesson of the day.");

        for (const TeacherSchedulingPreference& preference :
            context.problem.teacherSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.minimizeGaps;

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
                        ConstraintViolationType::TeacherGap;
                    violation.teacherId =
                        preference.teacherId;
                    violation.dayIndex =
                        dayIndex;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Teacher has gaps between lessons.";

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
