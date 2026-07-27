#pragma once

struct FitnessScore
{
    int hardViolationCount = 0;
    double softPenalty = 0.0;

    bool isFeasible() const
    {
        return hardViolationCount == 0;
    }

    bool isBetterThan(const FitnessScore& other) const
    {
        if (hardViolationCount != other.hardViolationCount)
        {
            return hardViolationCount < other.hardViolationCount;
        }

        return softPenalty < other.softPenalty;
    }
};
