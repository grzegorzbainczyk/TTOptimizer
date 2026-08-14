#pragma once

#include <cstddef>
#include <random>

#include "Domain/TimetableModels.h"

class ChromosomeMutator
{
public:
    explicit ChromosomeMutator(unsigned int seed) : randomEngine(seed) {}

    void mutateAssignment(Chromosome& chromosome, std::size_t scheduleSlotCount)
    {
        mutateAssignment(chromosome, scheduleSlotCount, randomEngine);
    }

    void mutateAssignment(Chromosome& chromosome, std::size_t scheduleSlotCount, std::mt19937& engine) const
    {
        if (chromosome.genes.empty() || scheduleSlotCount < 2)
        {
            return;
        }

        std::uniform_int_distribution<LessonInstanceIndex> lessonDistribution(0, chromosome.genes.size() - 1);
        const LessonInstanceIndex lessonIndex = lessonDistribution(engine);
        const ScheduleSlotIndex currentSlotIndex = chromosome.genes[lessonIndex];

        std::uniform_int_distribution<ScheduleSlotIndex> slotDistribution(0, scheduleSlotCount - 2);
        ScheduleSlotIndex newSlotIndex = slotDistribution(engine);

        if (newSlotIndex >= currentSlotIndex)
        {
            ++newSlotIndex;
        }

        chromosome.genes[lessonIndex] = newSlotIndex;
    }

private:
    std::mt19937 randomEngine;
};
