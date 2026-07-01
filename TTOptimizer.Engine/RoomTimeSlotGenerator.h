#include <vector>
#include <SampleTimetableData.h>

class RoomTimeSlotGenerator
{
    public:
        std::vector<RoomTimeSlot> generate(const TimetableProblem& problem) const
    {
        std::vector<RoomTimeSlot> result;

        result.reserve(
            problem.rooms.size()
            * static_cast<std::size_t>(problem.daysPerWeek)
            * static_cast<std::size_t>(problem.slotsPerDay)
        );

        for (const auto& room : problem.rooms)
        {
            for (int day = 0; day < problem.daysPerWeek; ++day)
            {
                for (int slot = 1; slot <= problem.slotsPerDay; ++slot)
                {
                    RoomTimeSlot roomTimeSlot;
                    roomTimeSlot.roomId = room.id;
                    roomTimeSlot.timeSlot = {
                        static_cast<DayOfWeek>(day),
                        slot
                    };

                    result.push_back(roomTimeSlot);
                }
            }
        }

        return result;
    }
};
