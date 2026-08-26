#pragma once

#include <iterator>
#include <utility>
#include <vector>

#include "Evaluation/ConstraintViolation.h"
#include "Evaluation/Rules/ConstraintRuleResult.h"

struct FitnessScore
{
    int hardViolationCount{};
    double softPenalty{};

    std::vector<ConstraintViolation> violations;
    std::vector<ConstraintRuleResult> ruleResults;

    bool isFeasible() const
    {
        return hardViolationCount == 0;
    }

    bool isBetterThan(
        const FitnessScore& other) const
    {
        /*
         * Hard constraints are always more important
         * than soft constraints.
         */
        if (hardViolationCount !=
            other.hardViolationCount)
        {
            return hardViolationCount <
                other.hardViolationCount;
        }

        return softPenalty <
            other.softPenalty;
    }

    void addHardViolation(
        ConstraintViolation violation,
        int count = 1)
    {
        if (count <= 0)
        {
            return;
        }

        hardViolationCount += count;
        violation.occurrenceCount = count;

        violations.push_back(std::move(violation));
    }

    void addSoftPenalty(double penalty)
    {
        if (penalty > 0.0)
        {
            softPenalty += penalty;
        }
    }

    void addRuleResult(
        ConstraintRuleResult result)
    {
        if (result.violationCount < 0)
        {
            result.violationCount = 0;
        }

        if (result.penalty < 0.0)
        {
            result.penalty = 0.0;
        }

        if (result.kind == ConstraintRuleKind::Hard)
        {
            hardViolationCount +=
                result.violationCount;

            violations.insert(
                violations.end(),
                std::make_move_iterator(
                    result.violations.begin()),
                std::make_move_iterator(
                    result.violations.end()));
        }
        else
        {
            softPenalty += result.penalty;
        }

        ruleResults.push_back(std::move(result));
    }
};
