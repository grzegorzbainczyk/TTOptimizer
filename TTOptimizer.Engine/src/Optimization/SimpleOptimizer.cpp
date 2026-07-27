#include "Optimization/SimpleOptimizer.h"

#include <iostream>

#include "Domain/TimetableProblem.h"

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

    bestChromosome.fitnessScore = fitnessEvaluator.evaluate(
        bestChromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    Chromosome currentChromosome = bestChromosome;

    std::cerr
        << "Initial fitness: hard violations = "
        << bestChromosome.fitnessScore.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitnessScore.softPenalty
        << '\n';

    for (int iteration = 1; iteration <= iterations; ++iteration)
    {
        Chromosome candidate = currentChromosome;

        mutator.mutateBySwap(candidate);

        candidate.fitnessScore = fitnessEvaluator.evaluate(
            candidate,
            problem,
            lessonInstances,
            scheduleSlots);

        if (candidate.fitnessScore.isBetterThan(
            currentChromosome.fitnessScore))
        {
            currentChromosome = candidate;

            if (candidate.fitnessScore.isBetterThan(
                bestChromosome.fitnessScore))
            {
                bestChromosome = candidate;

                std::cerr
                    << "Iteration: "
                    << iteration
                    << ", new best fitness: hard violations = "
                    << bestChromosome.fitnessScore.hardViolationCount
                    << ", soft penalty = "
                    << bestChromosome.fitnessScore.softPenalty
                    << '\n';
            }
        }
    }

    std::cerr
        << "Final fitness: hard violations = "
        << bestChromosome.fitnessScore.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitnessScore.softPenalty
        << '\n';

    return bestChromosome;
}
