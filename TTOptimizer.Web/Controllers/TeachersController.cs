using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeachersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public TeachersController(AppDbContext db)
    {
        _dbContext = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetTeachers([FromQuery] int organizationId)
    {
        var teachers = await _dbContext.Teachers
            .Where(t => t.OrganizationId == organizationId)
            .ToListAsync();

        return Ok(teachers);
    }
}