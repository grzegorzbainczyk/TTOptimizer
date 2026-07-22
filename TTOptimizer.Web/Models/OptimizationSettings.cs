namespace TTOptimizer.Web.Models.Optimization;

public class OptimizationSettings
{
    public int Iterations { get; set; } = 100_000;

    public int RandomSeed { get; set; } = 12345;
}