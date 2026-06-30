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
        if (string.IsNullOrWhiteSpace(request.Input))
        {
            return BadRequest("Input cannot be empty.");
        }

        var result = await _cppOptimizerService.RunOptimizerAsync(request.Input);

        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }
}