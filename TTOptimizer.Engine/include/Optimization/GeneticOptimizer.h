#pragma once

#include <random>
#include <vector>

#include "Domain/TimeTableModels.h"
#include "Domain/TimetableProblem.h"
#include "Evaluation/FitnessEvaluator.h"
#include "Generators/ChromosomeFactory.h"
#include "Optimization/ChromosomeMutator.h"

class GeneticOptimizer
{
public:
    explicit GeneticOptimizer(const OptimizationSettings& settings);

    std::vector<Chromosome> createInitialPopulation(
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots);

    Chromosome optimize(
        std::vector<Chromosome> initialPopulation,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots);

private:
    void validateOptimizationInput(
        const std::vector<Chromosome>& initialPopulation,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;

    Chromosome createChild(
        const Chromosome& parent,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots,
        std::bernoulli_distribution& mutationDistribution);

    bool shouldStop(const Chromosome& bestChromosome) const;

    void evaluatePopulation(
        std::vector<Chromosome>& population,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots);

    static void sortPopulation(std::vector<Chromosome>& population);

    const Chromosome& selectByTournament(const std::vector<Chromosome>& population);

    static bool isBetter(const Chromosome& first, const Chromosome& second);

    OptimizationSettings settings;

    ChromosomeFactory chromosomeFactory;
    ChromosomeMutator mutator;
    FitnessEvaluator fitnessEvaluator;

    std::mt19937 randomEngine;
};