namespace TTOptimizer.Web.Models;

/// <summary>
/// Represents an optimization request containing tasks and available resources.
/// </summary>
public class OptimizationRequest
{
    public List<OptimizationTask> Tasks { get; set; } = new();

    public int Resources { get; set; }
}

/// <summary>
/// Represents a single task processed by the optimizer.
/// </summary>
public class OptimizationTask
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Duration { get; set; }
}

/// <summary>
/// Represents the raw response returned after invoking the optimization process.
/// </summary>
public class OptimizationResponse
{
    public bool Success { get; set; }

    public string OutputJson { get; set; } = string.Empty;

    public string ErrorJson { get; set; } = string.Empty;
}

/// <summary>
/// Represents the optimization result returned by the engine.
/// </summary>
public class EngineOptimizationResult
{
    public bool Success { get; set; }

    public double InitialPenalty { get; set; }

    public double BestPenalty { get; set; }

    public List<int?> Genes { get; set; } = new();

    public string? Error { get; set; }
}

/// <summary>
/// Represents a scheduled lesson prepared for display in the user interface.
/// </summary>
public class ScheduledLessonView
{
    public int LessonInstanceId { get; set; }

    public string ClassGroup { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Teacher { get; set; } = string.Empty;

    public string Room { get; set; } = string.Empty;

    public string Day { get; set; } = string.Empty;

    public int LessonNumber { get; set; }
}
