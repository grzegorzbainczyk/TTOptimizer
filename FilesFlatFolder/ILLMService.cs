namespace TTOptimizer.Web.Services.AI;

public interface ILLMService
{
    Task<string> GenerateAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);
}