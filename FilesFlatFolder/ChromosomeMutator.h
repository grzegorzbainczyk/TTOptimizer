#pragma once

#include <cstddef>
#include <random>

#include "Domain/TimetableModels.h"

class ChromosomeMutator
{
public:
    explicit ChromosomeMutator(unsigned int seed) {};
    void mutateAssignment(Chromosome& chromosome, std::size_t scheduleSlotCount)
    {
        if (chromosome.genes.empty() || scheduleSlotCount < 2)
        {
            return;
        }

        std::uniform_int_distribution<LessonInstanceIndex> lessonDistribution(0, chromosome.genes.size() - 1);

        const LessonInstanceIndex lessonIndex = lessonDistribution(randomEngine);
        const ScheduleSlotIndex currentSlotIndex = chromosome.genes[lessonIndex];

        std::uniform_int_distribution<ScheduleSlotIndex> slotDistribution(0, scheduleSlotCount - 2);

        ScheduleSlotIndex newSlotIndex = slotDistribution(randomEngine);

        if (newSlotIndex >= currentSlotIndex)
        {
            ++newSlotIndex;
        }

        chromosome.genes[lessonIndex] = newSlotIndex;
    }

private:
    std::mt19937 randomEngine;
};