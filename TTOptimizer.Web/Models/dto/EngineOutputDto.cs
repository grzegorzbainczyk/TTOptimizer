using System.Text.Json.Serialization;

namespace TTOptimizer.Web.Models.DTO;

/// <summary>
/// Represents the complete result returned by the C++ optimization engine.
/// Contains the optimization status, penalty values, generated schedule,
/// execution details, and an optional error message.
/// </summary>
public class EngineOutputDto
{
    /// <summary>
    /// Gets or sets a value indicating whether the optimization process
    /// completed successfully.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Gets or sets the penalty value of the initial timetable
    /// before the optimization process started.
    /// </summary>
    public double InitialPenalty { get; set; }

    /// <summary>
    /// Gets or sets the lowest penalty value found during optimization.
    /// A lower value represents a better timetable.
    /// </summary>
    public double BestPenalty { get; set; }

    /// <summary>
    /// Gets or sets the collection of lessons scheduled by the optimization engine.
    /// The collection contains identifiers used by the backend to resolve
    /// domain entity names and create a view model for the frontend.
    /// </summary>
    public List<EngineScheduledLessonDto> ScheduledLessons { get; set; } = new();

    /// <summary>
    /// Gets or sets an optional error message returned by the optimization engine.
    /// The value is normally null when <see cref="Success"/> is true.
    /// </summary>
    public string? Error { get; set; }

    /// <summary>
    /// Gets or sets additional information about the optimization execution,
    /// such as the number of iterations, random seed, thread count,
    /// execution duration, and engine message.
    /// </summary>
    public required OptimizationInfo OptimizationInfo { get; set; }
}

/// <summary>
/// Contains diagnostic and execution information about an optimization run.
/// </summary>
public class OptimizationInfo
{
    /// <summary>
    /// Gets or sets the number of optimization iterations performed
    /// by the engine.
    /// </summary>
    [JsonPropertyName("iterations")]
    public int Iterations { get; set; }

    /// <summary>
    /// Gets or sets the random seed used by the optimization algorithm.
    /// Using the same seed may allow the optimization run to be reproduced.
    /// </summary>
    [JsonPropertyName("randomSeed")]
    public int RandomSeed { get; set; }

    /// <summary>
    /// Gets or sets the number of worker threads used during optimization.
    /// </summary>
    [JsonPropertyName("threadCount")]
    public int ThreadCount { get; set; }

    /// <summary>
    /// Gets or sets the total duration of the optimization process
    /// expressed in milliseconds.
    /// </summary>
    [JsonPropertyName("durationMilliseconds")]
    public long DurationMilliseconds { get; set; }

    /// <summary>
    /// Gets or sets an informational message returned by the optimization engine.
    /// </summary>
    [JsonPropertyName("message")]
    public required string Message { get; set; }
}

/// <summary>
/// Represents a scheduled lesson returned directly by the optimization engine.
/// Entity references are represented by numeric identifiers.
/// </summary>
public class EngineScheduledLessonDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the generated lesson instance.
    /// </summary>
    public int LessonInstanceId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the lesson requirement
    /// from which this lesson instance was created.
    /// </summary>
    public int RequirementId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the class group assigned to the lesson.
    /// </summary>
    public int ClassGroupId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the subject assigned to the lesson.
    /// </summary>
    public int SubjectId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the teacher assigned to the lesson.
    /// </summary>
    public int TeacherId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the room assigned to the lesson.
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// Gets or sets the name of the day on which the lesson is scheduled.
    /// </summary>
    public string Day { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the lesson slot number within the selected day.
    /// </summary>
    public int LessonNumber { get; set; }
}

/// <summary>
/// Represents a scheduled lesson prepared for presentation in the frontend.
/// Numeric entity identifiers are replaced with human-readable names.
/// </summary>
public class ScheduledLessonViewDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the generated lesson instance.
    /// </summary>
    public int LessonInstanceId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the lesson requirement
    /// from which this lesson instance was created.
    /// </summary>
    public int RequirementId { get; set; }

    /// <summary>
    /// Gets or sets the display name of the class group.
    /// </summary>
    public string ClassGroup { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name of the subject.
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name of the teacher.
    /// </summary>
    public string Teacher { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name or number of the room.
    /// </summary>
    public string Room { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the name of the day on which the lesson is scheduled.
    /// </summary>
    public string Day { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the lesson slot number within the selected day.
    /// </summary>
    public int LessonNumber { get; set; }
}