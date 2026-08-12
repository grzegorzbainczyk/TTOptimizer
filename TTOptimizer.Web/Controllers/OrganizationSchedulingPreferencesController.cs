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
    private const int DefaultMaxConsecutiveLessonsLimit = 4;
    private const int DefaultMaxLessonsPerDayLimit = 6;

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

        return Ok(new
        {
            success = true,
            preferences = CreateDto(
                organization.Id,
                organization.Name,
                preferences)
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

        if (!IsValidLevel(request.TeacherMinimizeGaps) ||
            !IsValidLevel(request.TeacherAvoidSingleLessonDay) ||
            !IsValidLevel(request.TeacherMaxConsecutiveLessons) ||
            !IsValidLevel(request.TeacherMaxLessonsPerDay))
        {
            return BadRequest(new
            {
                success = false,
                message = "One or more scheduling preference levels are invalid."
            });
        }

        if (!IsValidLimit(request.TeacherMaxConsecutiveLessonsLimit) ||
            !IsValidLimit(request.TeacherMaxLessonsPerDayLimit))
        {
            return BadRequest(new
            {
                success = false,
                message = "Lesson limits must be between 1 and 8."
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
                OrganizationId = organizationId
            };

            _dbContext.OrganizationSchedulingPreferences.Add(
                preferences);
        }

        preferences.TeacherMinimizeGaps =
            request.TeacherMinimizeGaps;

        preferences.TeacherAvoidSingleLessonDay =
            request.TeacherAvoidSingleLessonDay;

        preferences.TeacherMaxConsecutiveLessons =
            request.TeacherMaxConsecutiveLessons;

        preferences.TeacherMaxConsecutiveLessonsLimit =
            request.TeacherMaxConsecutiveLessonsLimit;

        preferences.TeacherMaxLessonsPerDay =
            request.TeacherMaxLessonsPerDay;

        preferences.TeacherMaxLessonsPerDayLimit =
            request.TeacherMaxLessonsPerDayLimit;

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Organization scheduling defaults were saved.",
            preferences = CreateDto(
                organization.Id,
                organization.Name,
                preferences)
        });
    }

    private static OrganizationSchedulingPreferencesDto CreateDto(
        int organizationId,
        string organizationName,
        OrganizationSchedulingPreferences? preferences)
    {
        return new OrganizationSchedulingPreferencesDto
        {
            OrganizationId = organizationId,
            OrganizationName = organizationName,

            TeacherMinimizeGaps =
                preferences?.TeacherMinimizeGaps
                ?? SchedulingPreferenceLevel.Medium,

            TeacherAvoidSingleLessonDay =
                preferences?.TeacherAvoidSingleLessonDay
                ?? SchedulingPreferenceLevel.Low,

            TeacherMaxConsecutiveLessons =
                preferences?.TeacherMaxConsecutiveLessons
                ?? SchedulingPreferenceLevel.Medium,

            TeacherMaxConsecutiveLessonsLimit =
                preferences?.TeacherMaxConsecutiveLessonsLimit
                ?? DefaultMaxConsecutiveLessonsLimit,

            TeacherMaxLessonsPerDay =
                preferences?.TeacherMaxLessonsPerDay
                ?? SchedulingPreferenceLevel.Medium,

            TeacherMaxLessonsPerDayLimit =
                preferences?.TeacherMaxLessonsPerDayLimit
                ?? DefaultMaxLessonsPerDayLimit
        };
    }

    private static bool IsValidLevel(
        SchedulingPreferenceLevel value)
    {
        return Enum.IsDefined(value);
    }

    private static bool IsValidLimit(int value)
    {
        return value is >= 1 and <= 8;
    }
}
