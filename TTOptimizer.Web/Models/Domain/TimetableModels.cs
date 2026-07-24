using TTOptimizer.Web.Models.Optimization;

namespace TTOptimizer.Web.Models.Domain;

public enum DayOfWeekModel
{
    Monday = 0,
    Tuesday = 1,
    Wednesday = 2,
    Thursday = 3,
    Friday = 4
}

public class TimeSlot
{
    public DayOfWeekModel Day { get; set; }

    public int LessonNumber { get; set; }
}

public class LessonInstance
{
    public int Id { get; set; }

    public int RequirementId { get; set; }
}

public class ScheduleSlot
{
    public int RoomId { get; set; }

    public TimeSlot TimeSlot { get; set; } = new();
}

public class TimetableProblem
{
    public List<Teacher> Teachers { get; set; } = new();

    public List<ClassGroup> ClassGroups { get; set; } = new();

    public List<Subject> Subjects { get; set; } = new();

    public List<Room> Rooms { get; set; } = new();

    public List<LessonRequirement> LessonRequirements { get; set; } = new();

    public List<TeacherUnavailabilityInput> TeacherUnavailabilities { get; set; } = new();
    public List<ClassGroupUnavailabilityInput> ClassGroupUnavailabilities { get; set; } = new();
    public List<RoomUnavailabilityInput> RoomUnavailabilities { get; set; } = new();

    public int DaysPerWeek { get; set; } = 5;

    public int SlotsPerDay { get; set; } = 8;

    public OptimizationSettings OptimizationSettings { get; set; } = new();
}