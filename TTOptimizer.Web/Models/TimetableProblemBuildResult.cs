using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models;

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