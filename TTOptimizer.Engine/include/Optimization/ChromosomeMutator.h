#pragma once

#include <cstddef>
#include <random>

#include "Domain/TimetableModels.h"

class ChromosomeMutator
{
public:
    explicit ChromosomeMutator(unsigned int seed);
    void mutateAssignment(Chromosome& chromosome, std::size_t scheduleSlotCount);

private:
    std::mt19937 randomEngine;
};