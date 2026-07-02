namespace TTOptimizer.Web.Models;

public class OptimizationViewResult
{
    public bool Success { get; set; }

    public double InitialPenalty { get; set; }

    public double BestPenalty { get; set; }

    public string? Error { get; set; }

    public List<ScheduledLessonView> ScheduledLessons { get; set; } = new();
}