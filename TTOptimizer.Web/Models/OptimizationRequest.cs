namespace TTOptimizer.Web.Models;

public class OptimizationRequest
{
    public List<OptimizationTask> Tasks { get; set; } = new();
    public int Resources { get; set; }
}