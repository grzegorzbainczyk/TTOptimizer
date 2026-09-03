using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Data;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DemoController : ControllerBase
{
    private const int HardDemoOrganizationId = 11;

    private readonly DemoDataSeeder _demoDataSeeder;

    public DemoController(DemoDataSeeder demoDataSeeder)
    {
        _demoDataSeeder = demoDataSeeder;
    }

    [HttpPost("login/empty")]
    public async Task<IActionResult> LoginEmpty()
    {
        var organizationId =
            await _demoDataSeeder.EnsureEmptyDemoDataAsync();

        return Ok(new
        {
            success = true,
            userId = 2, // temporary
            userName = "Demo Empty User",
            organizationId,
            demoLevel = "empty"
        });
    }

    [HttpPost("login")]
    [HttpPost("login/small")]
    public async Task<IActionResult> LoginSmall()
    {
        var organizationId =
            await _demoDataSeeder.EnsureSmallDemoDataAsync();

        return Ok(new
        {
            success = true,
            userId = 2, // temporary
            userName = "Demo Small School User",
            organizationId,
            demoLevel = "small"
        });
    }

    [HttpPost("login/hard")]
    [HttpPost("login/primary-school")]
    public IActionResult LoginPrimarySchool()
    {
        return Ok(new
        {
            success = true,
            userId = 2, // temporary
            userName = "Demo Primary School User",
            organizationId = HardDemoOrganizationId,
            demoLevel = "primary-school"
        });
    }
}
