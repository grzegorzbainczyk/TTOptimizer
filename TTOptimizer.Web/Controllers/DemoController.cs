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
    public async Task<IActionResult> Login()
    {
        var organizationId = await _demoDataSeeder.ResetDemoDataAsync();

        return Ok(new
        {
            success = true,
            userId = 2, // temporary
            userName = "Demo User",
            organizationId
        });
    }
}