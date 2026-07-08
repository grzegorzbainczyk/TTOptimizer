using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClassesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetClasses()
    {
        // Na razie demo. Docelowo weźmiemy OrganizationId z zalogowanego użytkownika.
        int organizationId = 1;

        var classes = await _db.ClassGroups
            .Where(t => t.OrganizationId == organizationId)
            .OrderBy(t => t.Name)
            .Select(t => new
            {
                t.Id,
                t.Name
            })
            .ToListAsync();

        return Ok(classes);
    }
}