#pragma once

#include <random>
#include <vector>

#include "Domain/TimeTableModels.h"
#include "Domain/TimetableProblem.h"
#include "Evaluation/FitnessEvaluator.h"
#include "Optimization/ChromosomeMutator.h"

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
    static double calculateEnergy(
        const FitnessScore& score);

    bool shouldAcceptWorseCandidate(
        const FitnessScore& candidate,
        const FitnessScore& current,
        double temperature);

    ChromosomeMutator mutator;
    FitnessEvaluator fitnessEvaluator;
    std::mt19937 randomEngine;
};
