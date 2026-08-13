#pragma once

#include <stdexcept>
#include <vector>

#include "Domain/TimetableModels.h"

class ChromosomeValidator
{
public:
    static void validate(
        const Chromosome& chromosome,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        /*
         * In the current chromosome model:
         *
         * gene index = lesson instance index
         * gene value = assigned schedule slot index
         */
        if (chromosome.genes.size() != lessonInstances.size())
        {
            throw std::runtime_error(
                "Invalid chromosome: genes size must be equal "
                "to lesson instances size.");
        }

        if (!lessonInstances.empty() && scheduleSlots.empty())
        {
            throw std::runtime_error(
                "Invalid chromosome: schedule slots cannot be empty "
                "when lesson instances exist.");
        }

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < chromosome.genes.size();
            ++lessonIndex)
        {
            const ScheduleSlotIndex scheduleSlotIndex =
                chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= scheduleSlots.size())
            {
                throw std::runtime_error(
                    "Invalid chromosome: schedule slot index "
                    "is out of range.");
            }
        }
    }
};