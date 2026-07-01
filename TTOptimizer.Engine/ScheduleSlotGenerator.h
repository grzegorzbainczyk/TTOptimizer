#pragma once

#include <vector>
#include "TimetableModels.h"

class ScheduleSlotGenerator
{
public:
    std::vector<ScheduleSlot> generate(const TimetableProblem& problem) const
    {
        std::vector<ScheduleSlot> scheduleSlots;

        const std::size_t expectedSize =
            problem.rooms.size()
            * static_cast<std::size_t>(problem.daysPerWeek)
            * static_cast<std::size_t>(problem.slotsPerDay);

        scheduleSlots.reserve(expectedSize);

        for (const Room& room : problem.rooms)
        {
            for (int day = 0; day < problem.daysPerWeek; ++day)
            {
                for (int lessonNumber = 1; lessonNumber <= problem.slotsPerDay; ++lessonNumber)
                {
                    ScheduleSlot scheduleSlot;
                    scheduleSlot.roomId = room.id;
                    scheduleSlot.timeSlot.day = static_cast<DayOfWeek>(day);
                    scheduleSlot.timeSlot.lessonNumber = lessonNumber;

                    scheduleSlots.push_back(scheduleSlot);
                }
            }
        }

        return scheduleSlots;
    }
};
