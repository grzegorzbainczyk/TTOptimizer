#pragma once

#include <string>
#include <utility>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/ConstraintRuleResult.h"

class SubjectSchedulingRuleSupport
{
public:
    static ConstraintRuleResult createResult(
        ConstraintRuleKind kind,
        ConstraintPenaltyLevel penaltyLevel,
        std::string code,
        std::string name,
        std::string description)
    {
        ConstraintRuleResult result;
        result.kind = kind;
        result.category =
            ConstraintRuleCategory::Subject;
        result.penaltyLevel = penaltyLevel;
        result.code = std::move(code);
        result.name = std::move(name);
        result.description =
            std::move(description);
        return result;
    }

    static double penaltyFor(
        SchedulingPreferenceLevel level,
        const OptimizationSettings& settings)
    {
        switch (level)
        {
        case SchedulingPreferenceLevel::Low:
            return settings.penalties.low;

        case SchedulingPreferenceLevel::Medium:
            return settings.penalties.medium;

        case SchedulingPreferenceLevel::High:
            return settings.penalties.high;

        case SchedulingPreferenceLevel::Disabled:
        case SchedulingPreferenceLevel::Hard:
            return 0.0;
        }

        return 0.0;
    }

    static void addResultIfViolated(
        std::vector<ConstraintRuleResult>& results,
        ConstraintRuleResult result)
    {
        if (result.violationCount > 0)
        {
            results.push_back(
                std::move(result));
        }
    }

    static ConstraintRuleResult* selectResult(
        SchedulingPreferenceLevel level,
        ConstraintRuleResult& lowResult,
        ConstraintRuleResult& mediumResult,
        ConstraintRuleResult& highResult,
        ConstraintRuleResult& hardResult)
    {
        switch (level)
        {
        case SchedulingPreferenceLevel::Low:
            return &lowResult;

        case SchedulingPreferenceLevel::Medium:
            return &mediumResult;

        case SchedulingPreferenceLevel::High:
            return &highResult;

        case SchedulingPreferenceLevel::Hard:
            return &hardResult;

        case SchedulingPreferenceLevel::Disabled:
            return nullptr;
        }

        return nullptr;
    }
};
