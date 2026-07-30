#include "Optimization/ChromosomeMutator.h"

ChromosomeMutator::ChromosomeMutator(unsigned int seed)
    : randomEngine(seed)
{
}

void ChromosomeMutator::mutateAssignment(
    Chromosome& chromosome,
    std::size_t scheduleSlotCount)
{
    if (chromosome.genes.empty() ||
        scheduleSlotCount < 2)
    {
        return;
    }

    std::uniform_int_distribution<LessonInstanceIndex>
        lessonDistribution(
            0,
            chromosome.genes.size() - 1);

    std::uniform_int_distribution<ScheduleSlotIndex>
        slotDistribution(
            0,
            scheduleSlotCount - 1);

    const LessonInstanceIndex lessonIndex =
        lessonDistribution(randomEngine);

    const ScheduleSlotIndex currentSlotIndex =
        chromosome.genes[lessonIndex];

    ScheduleSlotIndex newSlotIndex =
        slotDistribution(randomEngine);

    constexpr std::size_t maxAttempts = 20;

    for (std::size_t attempt = 0;
        attempt < maxAttempts &&
        newSlotIndex == currentSlotIndex;
        ++attempt)
    {
        newSlotIndex =
            slotDistribution(randomEngine);
    }

    if (newSlotIndex != currentSlotIndex)
    {
        chromosome.genes[lessonIndex] =
            newSlotIndex;
    }
}