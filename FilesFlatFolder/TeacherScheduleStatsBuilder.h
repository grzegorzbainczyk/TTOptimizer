#pragma once

#include <algorithm>
#include <unordered_map>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/TeacherScheduleStats.h"

class TeacherScheduleStatsBuilder
{
public:
    static TeacherScheduleStats build(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        TeacherScheduleStats result;

        std::unordered_map<
            TeacherId,
            std::vector<std::vector<bool>>>
            occupancy;

        for (const Teacher& teacher : problem.teachers)
        {
            occupancy.emplace(
                teacher.id,
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
            TeacherId>
            teacherByRequirementId;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            teacherByRequirementId.emplace(
                requirement.id,
                requirement.teacherId);
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

            const auto teacherIterator =
                teacherByRequirementId.find(
                    lessonInstances[lessonIndex].requirementId);

            if (teacherIterator ==
                teacherByRequirementId.end())
            {
                continue;
            }

            const auto occupancyIterator =
                occupancy.find(
                    teacherIterator->second);

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

        for (auto& [teacherId, days] : occupancy)
        {
            std::vector<TeacherDayScheduleStats>
                teacherDays(
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

                TeacherDayScheduleStats stats;
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

                teacherDays[
                    static_cast<std::size_t>(
                        dayIndex)] = stats;
            }

            result.byTeacher.emplace(
                teacherId,
                std::move(teacherDays));
        }

        return result;
    }
};
