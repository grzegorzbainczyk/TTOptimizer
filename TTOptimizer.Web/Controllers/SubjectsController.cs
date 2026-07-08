using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SubjectsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetSubjects()
    {
        int organizationId = 1;

        var subjects = await _db.Subjects
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                s.Id,
                s.Name
            })
            .ToListAsync();

        return Ok(subjects);
    }
}