using System.Text.Json;
using TTOptimizer.Web.Models.DTO.AI;

namespace TTOptimizer.Web.Services.AI;

public class LLMRuleInterpreterService : ILLMRuleInterpreterService
{
    private readonly ILLMService _llmService;

    public LLMRuleInterpreterService(ILLMService llmService)
    {
        _llmService = llmService;
    }

    public async Task<RuleInterpretationResultDto> InterpretAsync(
        RuleInterpretationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var systemPrompt = """
            You are a rule interpreter for ClassFlow,
            a school timetable optimization application.

            Convert the user's natural-language scheduling rule
            into JSON.

            Allowed rule types:
            - TeacherUnavailability
            - ClassUnavailability
            - RoomUnavailability
            - SubjectTimePreference
            - TeacherTimePreference
            - Unknown

            Do not invent missing information.

            If the rule cannot be interpreted reliably,
            return ruleType = "Unknown".

            Return JSON only.

            JSON format:
            {
              "success": true,
              "ruleType": "TeacherUnavailability",
              "teacherName": null,
              "className": null,
              "subjectName": null,
              "roomName": null,
              "day": null,
              "fromSlot": null,
              "toSlot": null,
              "message": null
            }
            """;

        var json = await _llmService.GenerateAsync(
            systemPrompt,
            request.Text,
            cancellationToken);

        try
        {
            var result =
                JsonSerializer.Deserialize<RuleInterpretationResultDto>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            if (result == null)
            {
                return CreateFailure("LLM returned an empty result.");
            }

            return result;
        }
        catch (JsonException)
        {
            return CreateFailure(
                "LLM returned an invalid JSON response.");
        }
    }

    private static RuleInterpretationResultDto CreateFailure(string message)
    {
        return new RuleInterpretationResultDto
        {
            Success = false,
            RuleType = "Unknown",
            Message = message
        };
    }
}