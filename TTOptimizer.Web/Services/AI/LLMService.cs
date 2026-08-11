using OpenAI.Chat;

namespace TTOptimizer.Web.Services.AI;

public class LLMService : ILLMService
{
    private readonly IConfiguration _configuration;

    public LLMService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<string> GenerateAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "OpenAI API key is not configured.");
        }

        var client = new ChatClient(
            "gpt-4.1-mini",
            apiKey);

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        };

        ChatCompletion completion =
            await client.CompleteChatAsync(
                messages,
                cancellationToken: cancellationToken);

        return completion.Content[0].Text;
    }
}