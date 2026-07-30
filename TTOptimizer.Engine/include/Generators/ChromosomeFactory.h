#pragma once

#include <algorithm>
#include <cstddef>
#include <random>
#include <stdexcept>
#include <vector>

#include "Domain/TimetableModels.h"

class ChromosomeFactory
{
public:
    explicit ChromosomeFactory(unsigned int seed)
        : randomEngine(seed)
    {
    }

    Chromosome createRandom(
        const std::vector<ScheduleSlot>& scheduleSlots,
        const std::vector<LessonInstance>& lessonInstances)
    {
        if (lessonInstances.empty())
        {
            return Chromosome{};
        }

        if (scheduleSlots.empty())
        {
            throw std::runtime_error(
                "Cannot create chromosome: no schedule slots are available.");
        }

        if (lessonInstances.size() > scheduleSlots.size())
        {
            throw std::runtime_error(
                "Cannot create chromosome: there are more lesson instances "
                "than schedule slots.");
        }

        std::vector<ScheduleSlotIndex> availableSlotIndices;
        availableSlotIndices.reserve(scheduleSlots.size());

        for (ScheduleSlotIndex slotIndex = 0;
            slotIndex < scheduleSlots.size();
            ++slotIndex)
        {
            availableSlotIndices.push_back(slotIndex);
        }

        std::shuffle(
            availableSlotIndices.begin(),
            availableSlotIndices.end(),
            randomEngine);

        Chromosome chromosome;
        chromosome.genes.resize(lessonInstances.size());

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < lessonInstances.size();
            ++lessonIndex)
        {
            chromosome.genes[lessonIndex] =
                availableSlotIndices[lessonIndex];
        }

        chromosome.fitness = FitnessScore{};

        return chromosome;
    }

private:
    std::mt19937 randomEngine;
};