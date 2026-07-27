#pragma once

#include <random>
#include <vector>

#include "Domain/TimeTableModels.h"
#include "Domain/TimetableProblem.h"
#include "Evaluation/FitnessEvaluator.h"
#include "Optimization/ChromosomeMutator.h"

class GeneticOptimizer
{
public:
    explicit GeneticOptimizer(unsigned int seed);

    Chromosome optimize(
        const Chromosome& initialChromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots,
        int generations,
        int populationSize,
        int eliteCount,
        int tournamentSize);

private:
    std::vector<Chromosome> createInitialPopulation(
        const Chromosome& initialChromosome,
        int populationSize);

    void evaluatePopulation(
        std::vector<Chromosome>& population,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots);

    static void sortPopulation(
        std::vector<Chromosome>& population);

    const Chromosome& selectByTournament(
        const std::vector<Chromosome>& population,
        int tournamentSize);

    static bool isBetter(
        const Chromosome& first,
        const Chromosome& second);

    ChromosomeMutator mutator;
    FitnessEvaluator fitnessEvaluator;
    std::mt19937 randomEngine;
};
