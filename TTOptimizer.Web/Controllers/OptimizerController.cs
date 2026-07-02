using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptimizationController : ControllerBase
{
    private readonly CppOptimizerService _optimizerService;

    public OptimizationController(CppOptimizerService optimizerService)
    {
        _optimizerService = optimizerService;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run()
    {
        string json = await _optimizerService.RunOptimizationAsync();

        return Content(json, "application/json");
    }
}