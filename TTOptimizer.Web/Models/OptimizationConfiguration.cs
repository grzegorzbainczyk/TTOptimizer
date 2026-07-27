namespace TTOptimizer.Web.Models.Optimization;

/// <summary>
/// Contains settings controlling the optimization process.
/// </summary>
public class OptimizationSettings
{
    public int Iterations { get; set; } = 100_000;

    public int RandomSeed { get; set; } = 12345;
}

/// <summary>
/// Represents a time slot during which a teacher is unavailable.
/// </summary>
public class TeacherUnavailabilityInput
{
    public int TeacherId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}

/// <summary>
/// Represents a time slot during which a class group is unavailable.
/// </summary>
public class ClassGroupUnavailabilityInput
{
    public int ClassGroupId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}

/// <summary>
/// Represents a time slot during which a room is unavailable.
/// </summary>
public class RoomUnavailabilityInput
{
    public int RoomId { get; set; }

    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}
