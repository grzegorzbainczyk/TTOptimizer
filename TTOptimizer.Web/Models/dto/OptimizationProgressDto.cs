namespace TTOptimizer.Web.Models.DTO;

/// <summary>
/// Represents a progress message emitted by the C++ optimization engine.
/// </summary>
public class OptimizationProgressDto
{
    public string Type { get; set; } = string.Empty;

    public int Generation { get; set; }

    public int TotalGenerations { get; set; }

    public int Percentage { get; set; }
}
