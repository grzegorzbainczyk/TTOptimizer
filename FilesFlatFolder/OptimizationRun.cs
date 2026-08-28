using TTOptimizer.Web.Models.Domain;

public class OptimizationRun
{
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public int Id { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public bool Success { get; set; }

    public int InitialPenalty { get; set; }

    public int BestPenalty { get; set; }

    public List<ScheduledLesson> ScheduledLessons { get; set; } = new();
}