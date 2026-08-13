#pragma once

#include <algorithm>
#include <map>
#include <utility>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/SubjectScheduleStats.h"

class SubjectScheduleStatsBuilder
{
public:
    static SubjectScheduleStats build(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        SubjectScheduleStats result;

        std::map<
            ClassGroupSubjectKey,
            std::vector<std::vector<bool>>>
            occupancy;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            const ClassGroupSubjectKey key{
                requirement.classGroupId,
                requirement.subjectId
            };

            if (occupancy.find(key) == occupancy.end())
            {
                occupancy.emplace(
                    key,
                    std::vector<std::vector<bool>>(
                        static_cast<std::size_t>(
                            problem.daysPerWeek),
                        std::vector<bool>(
                            static_cast<std::size_t>(
                                problem.slotsPerDay),
                            false)));
            }
        }

        std::map<
            LessonRequirementId,
            ClassGroupSubjectKey>
            keyByRequirementId;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            keyByRequirementId.emplace(
                requirement.id,
                ClassGroupSubjectKey{
                    requirement.classGroupId,
                    requirement.subjectId
                });
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

            const auto keyIterator =
                keyByRequirementId.find(
                    lessonInstances[lessonIndex].requirementId);

            if (keyIterator == keyByRequirementId.end())
            {
                continue;
            }

            const auto occupancyIterator =
                occupancy.find(keyIterator->second);

            if (occupancyIterator == occupancy.end())
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

            occupancyIterator->second[
                static_cast<std::size_t>(dayIndex)]
                [static_cast<std::size_t>(slotIndex)] = true;
        }

        for (const auto& [key, days] : occupancy)
        {
            SubjectClassScheduleStats stats;
            stats.days.resize(
                static_cast<std::size_t>(
                    problem.daysPerWeek));

            for (int dayIndex = 0;
                dayIndex < problem.daysPerWeek;
                ++dayIndex)
            {
                const auto& slots =
                    days[static_cast<std::size_t>(
                        dayIndex)];

                SubjectDayScheduleStats dayStats;

                int runLength = 0;

                const auto finishRun =
                    [&dayStats, &runLength]()
                    {
                        if (runLength <= 0)
                        {
                            return;
                        }

                        dayStats.adjacentPairCount +=
                            std::max(0, runLength - 1);

                        dayStats.unpairedLessonCount +=
                            runLength % 2;

                        runLength = 0;
                    };

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
                        finishRun();
                        continue;
                    }

                    ++dayStats.lessonCount;
                    ++runLength;
                }

                finishRun();

                if (dayStats.lessonCount > 0)
                {
                    ++stats.daysUsed;
                }

                stats.lessonCount +=
                    dayStats.lessonCount;

                stats.days[
                    static_cast<std::size_t>(
                        dayIndex)] = dayStats;
            }

            result.byClassGroupAndSubject.emplace(
                key,
                std::move(stats));
        }

        return result;
    }
};
