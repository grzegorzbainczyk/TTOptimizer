#pragma once

#include <functional>
#include <random>
#include <vector>

#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"
#include "Evaluation/FitnessEvaluator.h"
#include "Generators/ChromosomeFactory.h"
#include "Optimization/ChromosomeMutator.h"
#include "Optimization/OptimizationProgress.h"

class GeneticOptimizer
{
public:
    using ProgressCallback = std::function<void(const OptimizationProgress&)>;

    explicit GeneticOptimizer(
        const OptimizationSettings& settings,
        ProgressCallback progressCallback = nullptr);

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
    void reportProgress(
        int generation,
        int totalGenerations,
        int& lastReportedPercentage) const;

    void evaluatePopulation(
        std::vector<Chromosome>& population,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots);

    static void sortPopulation(
        std::vector<Chromosome>& population);

    const Chromosome& selectByTournament(
        const std::vector<Chromosome>& population);

    static bool isBetter(
        const Chromosome& first,
        const Chromosome& second);

    OptimizationSettings settings;
    ProgressCallback progressCallback;

    ChromosomeFactory chromosomeFactory;
    ChromosomeMutator mutator;
    FitnessEvaluator fitnessEvaluator;

    std::mt19937 randomEngine;
};
