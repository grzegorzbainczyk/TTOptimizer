#pragma once
#include "OptimizationResult.h"
#include <Domain/TimeTableModels.h>

class ChromosomeOutputDecoder
{

public:
    OptimizationResult decode(
        const Chromosome& chromosome,
        double initialPenalty,
        double bestPenalty) const
    {
        OptimizationResult result;

        result.success = true;
        result.initialPenalty = initialPenalty;
        result.bestPenalty = bestPenalty;
        result.error = "";

        for (const auto& gene : chromosome.genes)
        {
            OptimizationGeneResult geneResult;

            geneResult.lessonRequirementId = gene;
            geneResult.day = gene.day;
            geneResult.slot = gene.slot;
            geneResult.roomId = gene.roomId;

            result.genes.push_back(geneResult);
        }

        return result;
    }
};

