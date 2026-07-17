using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Data;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DemoController : ControllerBase
{
    private readonly DemoDataSeeder _demoDataSeeder;

    public DemoController(DemoDataSeeder demoDataSeeder)
    {
        _demoDataSeeder = demoDataSeeder;
    }

    [HttpPost("login")]
    public async Task<IActionResult> LoginEasy()
    {
        var organizationId =
            await _demoDataSeeder.ResetEasyDemoDataAsync();

        return Ok(new
        {
            success = true,
            userId = 2, // temporary
            userName = "Demo Easy User",
            organizationId,
            demoLevel = "easy"
        });
    }

    [HttpPost("login/hard")]
    public async Task<IActionResult> LoginHard()
    {
        var organizationId =
            await _demoDataSeeder.ResetHardDemoDataAsync();

        return Ok(new
        {
            success = true,
            userId = 2, // temporary
            userName = "Demo Hard User",
            organizationId,
            demoLevel = "hard"
        });
    }
}