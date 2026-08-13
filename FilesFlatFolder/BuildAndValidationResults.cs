using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models;

/// <summary>
/// Represents the result of building a timetable problem from application data.
/// </summary>
public class TimetableProblemBuildResult
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public TimetableProblem? Problem { get; set; }

    public static TimetableProblemBuildResult Ok(TimetableProblem problem)
    {
        return new TimetableProblemBuildResult
        {
            Success = true,
            Message = string.Empty,
            Problem = problem
        };
    }

    public static TimetableProblemBuildResult Fail(string message)
    {
        return new TimetableProblemBuildResult
        {
            Success = false,
            Message = message,
            Problem = null
        };
    }
}

/// <summary>
/// Represents the result of a validation operation.
/// </summary>
public class ValidationResult
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public static ValidationResult Ok()
    {
        return new ValidationResult
        {
            Success = true,
            Message = string.Empty
        };
    }

    public static ValidationResult Fail(string message)
    {
        return new ValidationResult
        {
            Success = false,
            Message = message
        };
    }
}
