namespace TTOptimizer.Web.Models;

public class EngineOptimizationResult
{
    public bool Success { get; set; }

    public double InitialPenalty { get; set; }

    public double BestPenalty { get; set; }

    public List<int?> Genes { get; set; } = new();

    public string? Error { get; set; }
}
