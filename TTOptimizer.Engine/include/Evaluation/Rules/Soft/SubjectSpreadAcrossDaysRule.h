#pragma once

#include <algorithm>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class SubjectSpreadAcrossDaysRule final : public IConstraintRule
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
                "SubjectSpreadAcrossDays.Low",
                "Spread subject across days (Low)",
                "Counts missing teaching days relative to the maximum feasible spread for each class and subject.");

        auto mediumResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "SubjectSpreadAcrossDays.Medium",
                "Spread subject across days (Medium)",
                "Counts missing teaching days relative to the maximum feasible spread for each class and subject.");

        auto highResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "SubjectSpreadAcrossDays.High",
                "Spread subject across days (High)",
                "Counts missing teaching days relative to the maximum feasible spread for each class and subject.");

        auto hardResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "SubjectSpreadAcrossDays.Hard",
                "Spread subject across days (Hard)",
                "Counts missing teaching days relative to the maximum feasible spread for each class and subject.");

        for (const SubjectSchedulingPreference& preference :
            context.problem.subjectSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.spreadAcrossDays;

            if (level == SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            for (const LessonRequirement& requirement :
                context.problem.lessonRequirements)
            {
                if (requirement.subjectId != preference.subjectId)
                {
                    continue;
                }

                const StudentGroupSubjectKey key{
                    requirement.studentGroupId,
                    requirement.subjectId
                };

                const auto statsIterator =
                    context.subjectScheduleStats
                        .byStudentGroupAndSubject.find(key);

                if (statsIterator ==
                    context.subjectScheduleStats
                        .byStudentGroupAndSubject.end())
                {
                    continue;
                }

                const int targetDays =
                    std::min(
                        requirement.weeklyCount,
                        context.problem.daysPerWeek);

                const int violationCount =
                    std::max(
                        0,
                        targetDays -
                        statsIterator->second.daysUsed);

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

                if (level == SchedulingPreferenceLevel::Hard)
                {
                    ConstraintViolation violation;
                    violation.type =
                        ConstraintViolationType::
                        SubjectSpreadAcrossDays;
                    violation.studentGroupId =
                        requirement.studentGroupId;
                    violation.subjectId =
                        requirement.subjectId;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Subject lessons are not spread across enough days.";

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
