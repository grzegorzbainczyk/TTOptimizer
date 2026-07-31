namespace TTOptimizer.Web.Models.Optimization;

/// <summary>
/// Contains settings controlling the optimization process.
/// </summary>
public class OptimizationSettings
{
    public int PopulationSize { get; set; } = 100;

    public int Iterations { get; set; } = 10_000;

    public int EliteCount { get; set; } = 5;

    public int TournamentSize { get; set; } = 3;

    public int MutationAttempts { get; set; } = 5;

    public double MutationProbability { get; set; } = 1.0;

    public int RandomSeed { get; set; } = 12_345;

    public int ThreadCount { get; set; } = 1;

    public bool StopWhenPerfect { get; set; } = true;

    public int StagnationGenerationLimit { get; set; }

    public bool EnableProgressLogging { get; set; } = true;

    public int ProgressLogInterval { get; set; } = 100;

    public PenaltySettings Penalties { get; set; } = new();
}

/// <summary>
/// Contains penalty values used by the optimization engine.
/// </summary>
public class PenaltySettings
{
    public int Low { get; set; } = 10;

    public int Medium { get; set; } = 100;

    public int High { get; set; } = 1_000;

    public int Hard { get; set; } = 1_000_000;
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
