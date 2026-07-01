#pragma once

#include <vector>

#include "Domain/TimetableModels.h"
#include "Evaluation/FitnessEvaluator.h"
#include "ChromosomeMutator.h"

class SimpleOptimizer
{
public:
    explicit SimpleOptimizer(unsigned int seed);

    Chromosome optimize(
        const Chromosome& initialChromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots,
        int iterations);

private:
    ChromosomeMutator mutator;
    FitnessEvaluator fitnessEvaluator;
};
