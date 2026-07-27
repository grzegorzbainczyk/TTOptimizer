#include "Optimization/SimpleOptimizer.h"

#include <algorithm>
#include <cmath>
#include <iostream>
#include <random>

namespace
{
    constexpr double HardViolationEnergy = 1'000'000.0;
    constexpr double InitialTemperature = 1'000'000.0;
    constexpr double CoolingRate = 0.9995;
    constexpr double MinimumTemperature = 0.0001;
}

SimpleOptimizer::SimpleOptimizer(unsigned int seed)
    : mutator(seed),
    randomEngine(seed)
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

    bestChromosome.fitness = fitnessEvaluator.evaluate(
        bestChromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    Chromosome currentChromosome = bestChromosome;

    double temperature = InitialTemperature;

    std::cerr
        << "Initial fitness: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';

    for (int iteration = 1; iteration <= iterations; ++iteration)
    {
        Chromosome candidate = currentChromosome;

        mutator.mutateBySwap(candidate);

        candidate.fitness = fitnessEvaluator.evaluate(
            candidate,
            problem,
            lessonInstances,
            scheduleSlots);

        const bool candidateIsBetter =
            candidate.fitness.isBetterThan(
                currentChromosome.fitness);

        const bool acceptWorseCandidate =
            !candidateIsBetter
            && shouldAcceptWorseCandidate(
                candidate.fitness,
                currentChromosome.fitness,
                temperature);

        if (candidateIsBetter || acceptWorseCandidate)
        {
            currentChromosome = candidate;
        }

        if (candidate.fitness.isBetterThan(
            bestChromosome.fitness))
        {
            bestChromosome = candidate;

            std::cerr
                << "Iteration: "
                << iteration
                << ", new best fitness: hard violations = "
                << bestChromosome.fitness.hardViolationCount
                << ", soft penalty = "
                << bestChromosome.fitness.softPenalty
                << ", temperature = "
                << temperature
                << '\n';
        }

        temperature = std::max(
            temperature * CoolingRate,
            MinimumTemperature);
    }

    std::cerr
        << "Final fitness: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';

    return bestChromosome;
}

double SimpleOptimizer::calculateEnergy(
    const FitnessScore& score)
{
    return
        static_cast<double>(score.hardViolationCount)
        * HardViolationEnergy
        + score.softPenalty;
}

bool SimpleOptimizer::shouldAcceptWorseCandidate(
    const FitnessScore& candidate,
    const FitnessScore& current,
    double temperature)
{
    const double candidateEnergy =
        calculateEnergy(candidate);

    const double currentEnergy =
        calculateEnergy(current);

    const double energyDifference =
        candidateEnergy - currentEnergy;

    if (energyDifference <= 0.0)
    {
        return true;
    }

    const double acceptanceProbability =
        std::exp(-energyDifference / temperature);

    std::uniform_real_distribution<double> distribution(
        0.0,
        1.0);

    return distribution(randomEngine)
        < acceptanceProbability;
}
