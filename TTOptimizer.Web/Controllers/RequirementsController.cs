using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequirementsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RequirementsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetRequirements([FromQuery] int organizationId)
    {      
        var requirements = await _db.LessonRequirements
            .Where(r => r.OrganizationId == organizationId)
            .OrderBy(r => r.Id)
            .Select(r => new
            {
                r.Id,

                r.TeacherId,
                TeacherName = r.Teacher.Name,

                r.ClassGroupId,
                ClassName = r.ClassGroup.Name,

                r.SubjectId,
                SubjectName = r.Subject.Name,

                r.HoursPerWeek
            })
            .ToListAsync();

        return Ok(requirements);
    }
}