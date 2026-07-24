namespace TTOptimizer.Web.Models.Optimization;

public class TeacherUnavailabilityInput
{
    public int TeacherId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}

public class ClassGroupUnavailabilityInput
{
    public int ClassGroupId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}

public class RoomUnavailabilityInput
{
    public int RoomId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}