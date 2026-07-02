#include "Optimization/SimpleOptimizer.h"

#include <iostream>

SimpleOptimizer::SimpleOptimizer(unsigned int seed)
    : mutator(seed)
{
}

Chromosome SimpleOptimizer::optimize(
    const Chromosome& initialChromosome,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots,
    int iterations)
{
    Chromosome bestChromosome = initialChromosome;

    bestChromosome.penalty = fitnessEvaluator.evaluate(
        bestChromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    Chromosome currentChromosome = bestChromosome;

    std::cerr << "Initial penalty: " << bestChromosome.penalty << '\n';

    for (int iteration = 1; iteration <= iterations; ++iteration)
    {
        Chromosome candidate = currentChromosome;

        mutator.mutateBySwap(candidate);

        candidate.penalty = fitnessEvaluator.evaluate(
            candidate,
            problem,
            lessonInstances,
            scheduleSlots);

        if (candidate.penalty < currentChromosome.penalty)
        {
            currentChromosome = candidate;

            if (candidate.penalty < bestChromosome.penalty)
            {
                bestChromosome = candidate;

                std::cerr
                    << "Iteration: " << iteration
                    << ", new best penalty: " << bestChromosome.penalty
                    << '\n';
            }
        }
    }

    std::cerr << "Final penalty: " << bestChromosome.penalty << '\n';

    return bestChromosome;
}