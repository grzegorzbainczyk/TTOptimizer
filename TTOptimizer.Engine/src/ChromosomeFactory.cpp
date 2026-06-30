#include "ChromosomeFactory.h"

#include <stdexcept>

ChromosomeFactory::ChromosomeFactory(unsigned int seed)
    : generator_(seed)
{
}

Chromosome ChromosomeFactory::createRandom(const TimetableProblem& problem)
{
    if (problem.daysPerWeek <= 0 || problem.slotsPerDay <= 0)
    {
        throw std::runtime_error("Invalid timetable dimensions.");
    }

    Chromosome chromosome;

    for (const auto& requirement : problem.lessonRequirements)
    {
        for (int i = 0; i < requirement.weeklyCount; ++i)
        {
            ScheduledLesson lesson;
            lesson.requirementId = requirement.id;
            lesson.timeSlot = randomTimeSlot(problem);
            lesson.roomId = randomRoomId(problem);

            chromosome.lessons.push_back(lesson);
        }
    }

    return chromosome;
}

TimeSlot ChromosomeFactory::randomTimeSlot(const TimetableProblem& problem)
{
    std::uniform_int_distribution<int> dayDistribution(0, problem.daysPerWeek - 1);
    std::uniform_int_distribution<int> slotDistribution(1, problem.slotsPerDay);

    const int day = dayDistribution(generator_);

    return TimeSlot{
        static_cast<DayOfWeek>(day),
        slotDistribution(generator_)
    };
}

std::optional<RoomId> ChromosomeFactory::randomRoomId(const TimetableProblem& problem)
{
    if (problem.rooms.empty())
    {
        return std::nullopt;
    }

    std::uniform_int_distribution<std::size_t> roomDistribution(0, problem.rooms.size() - 1);
    return problem.rooms[roomDistribution(generator_)].id;
}
