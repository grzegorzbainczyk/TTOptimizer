using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Services;

public class ScheduleSlotGeneratorService
{
    public List<ScheduleSlot> Generate(TimetableProblem problem)
    {
        var scheduleSlots = new List<ScheduleSlot>();

        foreach (var room in problem.Rooms)
        {
            for (int day = 0; day < problem.DaysPerWeek; day++)
            {
                for (int lessonNumber = 1; lessonNumber <= problem.SlotsPerDay; lessonNumber++)
                {
                    scheduleSlots.Add(new ScheduleSlot
                    {
                        RoomId = room.Id,
                        TimeSlot = new TimeSlot
                        {
                            Day = (DayOfWeekModel)day,
                            LessonNumber = lessonNumber
                        }
                    });
                }
            }
        }

        return scheduleSlots;
    }
}