#pragma once

#include <random>

#include "TimetableModels.h"

class ChromosomeMutator
{
public:
    explicit ChromosomeMutator(unsigned int seed);

    void mutateBySwap(Chromosome& chromosome);

private:
    std::mt19937 randomEngine;
};
