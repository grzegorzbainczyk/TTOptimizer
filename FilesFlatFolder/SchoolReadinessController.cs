using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/school-readiness")]
public class SchoolReadinessController : ControllerBase
{
    private readonly SchoolReadinessService _service;
    public SchoolReadinessController(SchoolReadinessService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int organizationId)
    {
        if (organizationId <= 0)
            return BadRequest(new { message = "Organization ID is required." });

        return Ok(await _service.GetReadinessAsync(organizationId));
    }
}
