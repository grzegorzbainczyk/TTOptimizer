#pragma once

#include <cstddef>
#include <stdexcept>
#include <vector>

#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"

class ScheduleSlotGenerator
{
public:
    static std::vector<ScheduleSlot> generate(
        const TimetableProblem& problem)
    {
        if (problem.daysPerWeek <= 0 ||
            problem.daysPerWeek > 7)
        {
            throw std::invalid_argument(
                "Days per week must be between 1 and 7.");
        }

        if (problem.slotsPerDay <= 0)
        {
            throw std::invalid_argument(
                "Slots per day must be greater than zero.");
        }

        std::vector<ScheduleSlot> scheduleSlots;

        const std::size_t expectedSize =
            problem.rooms.size()
            * static_cast<std::size_t>(problem.daysPerWeek)
            * static_cast<std::size_t>(problem.slotsPerDay);

        scheduleSlots.reserve(expectedSize);

        for (const Room& room : problem.rooms)
        {
            for (int dayIndex = 0;
                dayIndex < problem.daysPerWeek;
                ++dayIndex)
            {
                for (int slotIndex = 0;
                    slotIndex < problem.slotsPerDay;
                    ++slotIndex)
                {
                    ScheduleSlot scheduleSlot;

                    scheduleSlot.roomId = room.id;
                    scheduleSlot.timeSlot.day =
                        static_cast<DayOfWeek>(dayIndex);
                    scheduleSlot.timeSlot.lessonNumber =
                        slotIndex;

                    scheduleSlots.push_back(scheduleSlot);
                }
            }
        }

        return scheduleSlots;
    }
};