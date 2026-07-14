#pragma once

#include <string>
#include <vector>

struct OptimizationGeneResult
{
    int lessonRequirementId = 0;
    int day = 0;
    int slot = 0;
    int roomId = 0;
};

struct OptimizationResult
{
    bool success = true;
    double initialPenalty = 0.0;
    double bestPenalty = 0.0;
    std::vector<OptimizationGeneResult> genes;
    std::string error;
};