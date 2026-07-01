#include "Optimization/ChromosomeMutator.h"

#include <algorithm>

ChromosomeMutator::ChromosomeMutator(unsigned int seed)
    : randomEngine(seed)
{
}

void ChromosomeMutator::mutateBySwap(Chromosome& chromosome)
{
    if (chromosome.genes.size() < 2)
    {
        return;
    }

    std::uniform_int_distribution<std::size_t> distribution(
        0,
        chromosome.genes.size() - 1);

    std::size_t firstIndex = distribution(randomEngine);
    std::size_t secondIndex = distribution(randomEngine);

    while (secondIndex == firstIndex)
    {
        secondIndex = distribution(randomEngine);
    }

    std::swap(
        chromosome.genes[firstIndex],
        chromosome.genes[secondIndex]);
}