#pragma once

#include <vector>
#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"
#include "Evaluation/FitnessScore.h"

class FitnessEvaluator
{
private:
    enum class PenaltyLevel : int
    {
        None = 0,
        Low = 10,
        Medium = 100,
        High = 1'000
    };

    static constexpr double ToPenalty(PenaltyLevel level)
    {
        return static_cast<double>(level);
    }

public:
    FitnessScore evaluate(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;
};
