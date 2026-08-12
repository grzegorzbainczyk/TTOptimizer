#pragma once

struct OptimizationProgressBest
{
    int hardViolationCount = 0;

    double softPenalty = 0.0;
};

struct OptimizationProgress
{
    int generation = 0;

    int totalGenerations = 0;

    int percentage = 0;

    int bestFoundAtGeneration = 0;

    OptimizationProgressBest best;
};
