#include <algorithm>
#include <stdexcept>
#include <random>
#include <vector>
#include "TimeTableModels.h"

using LessonInstanceIndex = std::size_t;
using ScheduleSlotIndex = std::size_t;

class ChromosomeFactory
{
public:
    ChromosomeFactory(unsigned int seed)
        : randomEngine(seed)
    {
    }

    Chromosome createRandom(
        const std::vector<ScheduleSlot>& scheduleSlots,
        const std::vector<LessonInstance>& lessonInstances)
    {
        if (lessonInstances.size() > scheduleSlots.size())
        {
            throw std::runtime_error(
                "Cannot create chromosome: there are more lesson instances than schedule slots.");
        }

        Chromosome chromosome;
        chromosome.genes.resize(scheduleSlots.size(), std::nullopt);
        chromosome.penalty = 0.0;

        std::vector<ScheduleSlotIndex> freeSlotIndices;
        freeSlotIndices.reserve(scheduleSlots.size());

        for (ScheduleSlotIndex i = 0; i < scheduleSlots.size(); ++i)
        {
            freeSlotIndices.push_back(i);
        }

        std::shuffle(
            freeSlotIndices.begin(),
            freeSlotIndices.end(),
            randomEngine);

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < lessonInstances.size();
            ++lessonIndex)
        {
            ScheduleSlotIndex slotIndex = freeSlotIndices[lessonIndex];
            chromosome.genes[slotIndex] = lessonIndex;
        }

        return chromosome;
    }

private:
    std::mt19937 randomEngine;
};