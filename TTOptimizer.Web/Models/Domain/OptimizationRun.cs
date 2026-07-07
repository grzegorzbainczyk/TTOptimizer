public class OptimizationRun
{
    public int Id { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public bool Success { get; set; }

    public int InitialPenalty { get; set; }

    public int BestPenalty { get; set; }

    public List<ScheduledLesson> ScheduledLessons { get; set; } = new();
}