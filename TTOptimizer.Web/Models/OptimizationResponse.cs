namespace TTOptimizer.Web.Models;

public class OptimizationResponse
{
    public bool Success { get; set; }
    public string OutputJson { get; set; } = string.Empty;
    public string ErrorJson { get; set; } = string.Empty;
}