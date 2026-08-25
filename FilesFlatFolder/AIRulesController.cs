using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Models.DTO.AI;
using TTOptimizer.Web.Services.AI;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/ai/rules")]
public class AIRulesController : ControllerBase
{
    private readonly ILLMRuleInterpreterService _ruleInterpreterService;

    public AIRulesController(
        ILLMRuleInterpreterService ruleInterpreterService)
    {
        _ruleInterpreterService = ruleInterpreterService;
    }

    [HttpPost("interpret")]
    public async Task<IActionResult> Interpret(
        RuleInterpretationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new
            {
                success = false,
                message = "Rule text cannot be empty."
            });
        }

        var result =
            await _ruleInterpreterService.InterpretAsync(
                request,
                cancellationToken);

        return Ok(result);
    }
}