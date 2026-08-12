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

public class TeacherTimeSlotPreferenceInput
{
    public int TeacherId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
}

public class ClassGroupTimeSlotPreferenceInput
{
    public int ClassGroupId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
}

public class RoomTimeSlotPreferenceInput
{
    public int RoomId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
}

public class SubjectTimeSlotPreferenceInput
{
    public int SubjectId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
}

public class TeacherSchedulingPreferenceInput
{
    public int TeacherId { get; set; }

    public SchedulingPreferenceLevel MinimizeGaps { get; set; }

    public SchedulingPreferenceLevel AvoidSingleLessonDay { get; set; }

    public SchedulingPreferenceLevel MaxConsecutiveLessons { get; set; }

    public int MaxConsecutiveLessonsLimit { get; set; }

    public SchedulingPreferenceLevel MaxLessonsPerDay { get; set; }

    public int MaxLessonsPerDayLimit { get; set; }
}


public class ClassGroupSchedulingPreferenceInput
{
    public int ClassGroupId { get; set; }

    public SchedulingPreferenceLevel MinimizeGaps { get; set; }

    public SchedulingPreferenceLevel AvoidSingleLessonDay { get; set; }

    public SchedulingPreferenceLevel MaxConsecutiveLessons { get; set; }

    public int MaxConsecutiveLessonsLimit { get; set; }

    public SchedulingPreferenceLevel MaxLessonsPerDay { get; set; }

    public int MaxLessonsPerDayLimit { get; set; }
}

public class TimetableProblem
{
    public List<Teacher> Teachers { get; set; } = new();

    public List<ClassGroup> ClassGroups { get; set; } = new();

    public List<Subject> Subjects { get; set; } = new();

    public List<Room> Rooms { get; set; } = new();

    public List<LessonRequirement> LessonRequirements { get; set; } = new();

    public List<TeacherTimeSlotPreferenceInput> TeacherTimeSlotPreferences { get; set; } = new();
    public List<ClassGroupTimeSlotPreferenceInput> ClassGroupTimeSlotPreferences { get; set; } = new();
    public List<RoomTimeSlotPreferenceInput> RoomTimeSlotPreferences { get; set; } = new();
    public List<SubjectTimeSlotPreferenceInput> SubjectTimeSlotPreferences { get; set; } = new();

    public List<TeacherSchedulingPreferenceInput> TeacherSchedulingPreferences { get; set; } = new();
    public List<ClassGroupSchedulingPreferenceInput> ClassGroupSchedulingPreferences { get; set; } = new();

    public int DaysPerWeek { get; set; } = 5;

    public int SlotsPerDay { get; set; } = 8;

    public OptimizationSettings OptimizationSettings { get; set; } = new();
}
