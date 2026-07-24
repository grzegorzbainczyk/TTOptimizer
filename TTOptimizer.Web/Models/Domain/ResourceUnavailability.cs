namespace TTOptimizer.Web.Models.Domain;

public class TeacherUnavailability
{
    public int Id { get; set; }

    public int TeacherId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }

    public Teacher Teacher { get; set; } = null!;
}

public class ClassGroupUnavailability
{
    public int Id { get; set; }

    public int ClassGroupId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }

    public ClassGroup ClassGroup { get; set; } = null!;
}

public class RoomUnavailability
{
    public int Id { get; set; }

    public int RoomId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }

    public Room Room { get; set; } = null!;
}