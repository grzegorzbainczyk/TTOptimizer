#pragma once

#include <algorithm>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class SubjectPreferDoubleLessonsRule final : public IConstraintRule
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
                "SubjectPreferDoubleLessons.Low",
                "Prefer subject double lessons (Low)",
                "Counts avoidable unpaired subject lessons for each class when double lessons are preferred.");

        auto mediumResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "SubjectPreferDoubleLessons.Medium",
                "Prefer subject double lessons (Medium)",
                "Counts avoidable unpaired subject lessons for each class when double lessons are preferred.");

        auto highResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "SubjectPreferDoubleLessons.High",
                "Prefer subject double lessons (High)",
                "Counts avoidable unpaired subject lessons for each class when double lessons are preferred.");

        auto hardResult =
            SubjectSchedulingRuleSupport::createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "SubjectPreferDoubleLessons.Hard",
                "Prefer subject double lessons (Hard)",
                "Counts avoidable unpaired subject lessons for each class when double lessons are preferred.");

        for (const SubjectSchedulingPreference& preference :
            context.problem.subjectSchedulingPreferences)
        {
            const SchedulingPreferenceLevel level =
                preference.preferDoubleLessons;

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

                const ClassGroupSubjectKey key{
                    requirement.classGroupId,
                    requirement.subjectId
                };

                const auto statsIterator =
                    context.subjectScheduleStats
                        .byClassGroupAndSubject.find(key);

                if (statsIterator ==
                    context.subjectScheduleStats
                        .byClassGroupAndSubject.end())
                {
                    continue;
                }

                int actualUnpairedLessons = 0;

                for (const auto& dayStats :
                    statsIterator->second.days)
                {
                    actualUnpairedLessons +=
                        dayStats.unpairedLessonCount;
                }

                const int unavoidableUnpairedLessons =
                    requirement.weeklyCount % 2;

                const int violationCount =
                    std::max(
                        0,
                        actualUnpairedLessons -
                        unavoidableUnpairedLessons);

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
                        SubjectPreferDoubleLessons;
                    violation.classGroupId =
                        requirement.classGroupId;
                    violation.subjectId =
                        requirement.subjectId;
                    violation.occurrenceCount =
                        violationCount;
                    violation.message =
                        "Subject has avoidable unpaired lessons.";

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
