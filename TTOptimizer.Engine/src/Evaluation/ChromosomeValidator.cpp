#include "Evaluation/ChromosomeValidator.h"

#include <stdexcept>
#include <string>
#include <vector>

void ChromosomeValidator::validate(
    const Chromosome& chromosome,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    if (chromosome.genes.size() != scheduleSlots.size())
    {
        throw std::runtime_error(
            "Invalid chromosome: genes size must be equal to schedule slots size.");
    }

    std::vector<int> lessonUsageCount(lessonInstances.size(), 0);

    int occupiedGenesCount = 0;

    for (ScheduleSlotIndex slotIndex = 0;
        slotIndex < chromosome.genes.size();
        ++slotIndex)
    {
        const auto& gene = chromosome.genes[slotIndex];

        if (!gene.has_value())
        {
            continue;
        }

        ++occupiedGenesCount;

        LessonInstanceIndex lessonIndex = gene.value();

        if (lessonIndex >= lessonInstances.size())
        {
            throw std::runtime_error(
                "Invalid chromosome: lesson instance index is out of range.");
        }

        lessonUsageCount[lessonIndex]++;
    }

    if (occupiedGenesCount != static_cast<int>(lessonInstances.size()))
    {
        throw std::runtime_error(
            "Invalid chromosome: occupied genes count must be equal to lesson instances count.");
    }

    for (LessonInstanceIndex lessonIndex = 0;
        lessonIndex < lessonUsageCount.size();
        ++lessonIndex)
    {
        if (lessonUsageCount[lessonIndex] == 0)
        {
            throw std::runtime_error(
                "Invalid chromosome: lesson instance is missing.");
        }

        if (lessonUsageCount[lessonIndex] > 1)
        {
            throw std::runtime_error(
                "Invalid chromosome: lesson instance appears more than once.");
        }
    }
}
