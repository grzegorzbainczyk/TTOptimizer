using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.SchedulingPreferences;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/organization-scheduling-preferences")]
public class OrganizationSchedulingPreferencesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public OrganizationSchedulingPreferencesController(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organization = await _dbContext.Organizations
            .AsNoTracking()
            .Where(item => item.Id == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var preferences =
            await _dbContext.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        var teacherMinimizeGaps =
            preferences?.TeacherMinimizeGaps
            ?? SchedulingPreferenceLevel.Medium;

        return Ok(new
        {
            success = true,
            preferences = new OrganizationSchedulingPreferencesDto
            {
                OrganizationId = organization.Id,
                OrganizationName = organization.Name,
                TeacherMinimizeGaps = teacherMinimizeGaps
            }
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update(
        [FromQuery] int organizationId,
        [FromBody] UpdateOrganizationSchedulingPreferencesRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        if (!Enum.IsDefined(request.TeacherMinimizeGaps))
        {
            return BadRequest(new
            {
                success = false,
                message = "Teacher minimize gaps value is invalid."
            });
        }

        var organization = await _dbContext.Organizations
            .Where(item => item.Id == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var preferences =
            await _dbContext.OrganizationSchedulingPreferences
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        if (preferences == null)
        {
            preferences = new OrganizationSchedulingPreferences
            {
                OrganizationId = organizationId,
                TeacherMinimizeGaps = request.TeacherMinimizeGaps
            };

            _dbContext.OrganizationSchedulingPreferences.Add(
                preferences);
        }
        else
        {
            preferences.TeacherMinimizeGaps =
                request.TeacherMinimizeGaps;
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Organization scheduling defaults were saved.",
            preferences = new OrganizationSchedulingPreferencesDto
            {
                OrganizationId = organization.Id,
                OrganizationName = organization.Name,
                TeacherMinimizeGaps =
                    preferences.TeacherMinimizeGaps
            }
        });
    }
}
