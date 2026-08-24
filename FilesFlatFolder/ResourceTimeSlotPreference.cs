namespace TTOptimizer.Web.Models.Domain;

public class TeacherTimeSlotPreference
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
    public Teacher Teacher { get; set; } = null!;
}

public class ClassGroupTimeSlotPreference
{
    public int Id { get; set; }
    public int ClassGroupId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
    public ClassGroup ClassGroup { get; set; } = null!;
}

public class RoomTimeSlotPreference
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
    public Room Room { get; set; } = null!;
}

public class SubjectTimeSlotPreference
{
    public int Id { get; set; }
    public int SubjectId { get; set; }
    public int DayIndex { get; set; }
    public int SlotIndex { get; set; }
    public TimeSlotPreferenceType PreferenceType { get; set; }
    public Subject Subject { get; set; } = null!;
}
