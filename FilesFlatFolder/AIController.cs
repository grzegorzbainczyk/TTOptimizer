using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Models.DTO.AI;
using TTOptimizer.Web.Services.AI;
using Microsoft.AspNetCore.Authorization;


//[Authorize]
[ApiController]
[Route("api/ai")]
public class AIController : ControllerBase
{
    private readonly ILLMService _llmService;

    public AIController(ILLMService llmService)
    {
        _llmService = llmService;
    }

    [HttpPost("test")]
    public async Task<IActionResult> Test(
        [FromBody] AITestRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _llmService.GenerateAsync(
            "You are a test assistant for ClassFlow. Respond briefly.",
            request.Prompt,
            cancellationToken);

        return Ok(new
        {
            success = true,
            response
        });
    }
}