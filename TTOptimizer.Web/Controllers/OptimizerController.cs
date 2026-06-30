using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptimizerController : ControllerBase
{
    private readonly CppOptimizerService _cppOptimizerService;

    public OptimizerController(CppOptimizerService cppOptimizerService)
    {
        _cppOptimizerService = cppOptimizerService;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run([FromBody] OptimizationRequest request)
    {
        if (request.Resources <= 0)
        {
            return BadRequest("Resources must be greater than zero.");
        }

        if (request.Tasks.Count == 0)
        {
            return BadRequest("At least one task is required.");
        }

        var result = await _cppOptimizerService.RunOptimizerAsync(request);

        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Content(result.OutputJson, "application/json");
    }
}