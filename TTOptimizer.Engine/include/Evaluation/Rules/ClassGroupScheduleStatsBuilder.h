#pragma once

#include <algorithm>
#include <unordered_map>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/ClassGroupScheduleStats.h"

class ClassGroupScheduleStatsBuilder
{
public:
    static ClassGroupScheduleStats build(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        ClassGroupScheduleStats result;

        std::unordered_map<
            ClassGroupId,
            std::vector<std::vector<bool>>>
            occupancy;

        for (const ClassGroup& classGroup : problem.classGroups)
        {
            occupancy.emplace(
                classGroup.id,
                std::vector<std::vector<bool>>(
                    static_cast<std::size_t>(
                        problem.daysPerWeek),
                    std::vector<bool>(
                        static_cast<std::size_t>(
                            problem.slotsPerDay),
                        false)));
        }

        std::unordered_map<
            LessonRequirementId,
            ClassGroupId>
            classGroupByRequirementId;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            classGroupByRequirementId.emplace(
                requirement.id,
                requirement.classGroupId);
        }

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < chromosome.genes.size();
            ++lessonIndex)
        {
            if (lessonIndex >= lessonInstances.size())
            {
                continue;
            }

            const ScheduleSlotIndex scheduleSlotIndex =
                chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= scheduleSlots.size())
            {
                continue;
            }

            const auto classGroupIterator =
                classGroupByRequirementId.find(
                    lessonInstances[lessonIndex].requirementId);

            if (classGroupIterator ==
                classGroupByRequirementId.end())
            {
                continue;
            }

            const auto occupancyIterator =
                occupancy.find(
                    classGroupIterator->second);

            if (occupancyIterator ==
                occupancy.end())
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                scheduleSlots[scheduleSlotIndex];

            const int dayIndex =
                static_cast<int>(
                    scheduleSlot.timeSlot.day);

            const int slotIndex =
                scheduleSlot.timeSlot.lessonNumber;

            if (dayIndex < 0 ||
                dayIndex >= problem.daysPerWeek ||
                slotIndex < 0 ||
                slotIndex >= problem.slotsPerDay)
            {
                continue;
            }

            occupancyIterator
                ->second[
                    static_cast<std::size_t>(
                        dayIndex)]
                [
                    static_cast<std::size_t>(
                        slotIndex)
                ] = true;
        }

        for (auto& [classGroupId, days] : occupancy)
        {
            std::vector<ClassGroupDayScheduleStats>
                classGroupDays(
                    static_cast<std::size_t>(
                        problem.daysPerWeek));

            for (int dayIndex = 0;
                dayIndex < problem.daysPerWeek;
                ++dayIndex)
            {
                const auto& slots =
                    days[
                        static_cast<std::size_t>(
                            dayIndex)];

                ClassGroupDayScheduleStats stats;
                int currentConsecutive = 0;

                for (int slotIndex = 0;
                    slotIndex < problem.slotsPerDay;
                    ++slotIndex)
                {
                    const bool occupied =
                        slots[
                            static_cast<std::size_t>(
                                slotIndex)];

                    if (!occupied)
                    {
                        currentConsecutive = 0;
                        continue;
                    }

                    ++stats.lessonCount;

                    if (stats.firstSlot < 0)
                    {
                        stats.firstSlot = slotIndex;
                    }

                    stats.lastSlot = slotIndex;

                    ++currentConsecutive;

                    stats.maxConsecutiveLessons =
                        std::max(
                            stats.maxConsecutiveLessons,
                            currentConsecutive);
                }

                classGroupDays[
                    static_cast<std::size_t>(
                        dayIndex)] = stats;
            }

            result.byClassGroup.emplace(
                classGroupId,
                std::move(classGroupDays));
        }

        return result;
    }
};
