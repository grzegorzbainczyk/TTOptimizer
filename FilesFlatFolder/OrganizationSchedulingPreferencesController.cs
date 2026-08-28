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
    private const int DefaultClassGroupMaxConsecutiveLessonsLimit = 6;
    private const int DefaultClassGroupMaxLessonsPerDayLimit = 8;
    private const int DefaultSubjectMaxOccurrencesPerDayLimit = 1;

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
            !IsValidLevel(request.TeacherAvoidImmediateBuildingChange) ||
            !IsValidLevel(request.TeacherMaxConsecutiveLessons) ||
            !IsValidLevel(request.TeacherMaxLessonsPerDay) ||
            !IsValidLevel(request.StudentGroupAvoidImmediateBuildingChange) ||
            !IsValidLevel(request.ClassGroupMinimizeGaps) ||
            !IsValidLevel(request.ClassGroupAvoidSingleLessonDay) ||
            !IsValidLevel(request.ClassGroupMaxConsecutiveLessons) ||
            !IsValidLevel(request.ClassGroupMaxLessonsPerDay) ||
            !IsValidLevel(request.SubjectSpreadAcrossDays) ||
            !IsValidLevel(request.SubjectMaxOccurrencesPerDay) ||
            !IsValidLevel(request.SubjectPreferDoubleLessons) ||
            !IsValidLevel(request.SubjectAvoidDoubleLessons))
        {
            return BadRequest(new
            {
                success = false,
                message = "One or more scheduling preference levels are invalid."
            });
        }

        if (!IsValidLimit(request.TeacherMaxConsecutiveLessonsLimit) ||
            !IsValidLimit(request.TeacherMaxLessonsPerDayLimit) ||
            !IsValidLimit(request.ClassGroupMaxConsecutiveLessonsLimit) ||
            !IsValidLimit(request.ClassGroupMaxLessonsPerDayLimit) ||
            !IsValidLimit(request.SubjectMaxOccurrencesPerDayLimit))
        {
            return BadRequest(new
            {
                success = false,
                message = "Lesson limits must be between 1 and 8."
            });
        }

        if (IsEnabled(request.SubjectPreferDoubleLessons) &&
            IsEnabled(request.SubjectAvoidDoubleLessons))
        {
            return BadRequest(new
            {
                success = false,
                message = "Prefer double lessons and avoid double lessons cannot both be enabled for subjects."
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

        preferences.TeacherAvoidImmediateBuildingChange =
            request.TeacherAvoidImmediateBuildingChange;

        preferences.TeacherMaxConsecutiveLessons =
            request.TeacherMaxConsecutiveLessons;

        preferences.TeacherMaxConsecutiveLessonsLimit =
            request.TeacherMaxConsecutiveLessonsLimit;

        preferences.TeacherMaxLessonsPerDay =
            request.TeacherMaxLessonsPerDay;

        preferences.TeacherMaxLessonsPerDayLimit =
            request.TeacherMaxLessonsPerDayLimit;

        preferences.StudentGroupAvoidImmediateBuildingChange =
            request.StudentGroupAvoidImmediateBuildingChange;

        preferences.ClassGroupMinimizeGaps =
            request.ClassGroupMinimizeGaps;

        preferences.ClassGroupAvoidSingleLessonDay =
            request.ClassGroupAvoidSingleLessonDay;

        preferences.ClassGroupMaxConsecutiveLessons =
            request.ClassGroupMaxConsecutiveLessons;

        preferences.ClassGroupMaxConsecutiveLessonsLimit =
            request.ClassGroupMaxConsecutiveLessonsLimit;

        preferences.ClassGroupMaxLessonsPerDay =
            request.ClassGroupMaxLessonsPerDay;

        preferences.ClassGroupMaxLessonsPerDayLimit =
            request.ClassGroupMaxLessonsPerDayLimit;

        preferences.SubjectSpreadAcrossDays =
            request.SubjectSpreadAcrossDays;

        preferences.SubjectMaxOccurrencesPerDay =
            request.SubjectMaxOccurrencesPerDay;

        preferences.SubjectMaxOccurrencesPerDayLimit =
            request.SubjectMaxOccurrencesPerDayLimit;

        preferences.SubjectPreferDoubleLessons =
            request.SubjectPreferDoubleLessons;

        preferences.SubjectAvoidDoubleLessons =
            request.SubjectAvoidDoubleLessons;

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

            TeacherAvoidImmediateBuildingChange =
                preferences?.TeacherAvoidImmediateBuildingChange
                ?? SchedulingPreferenceLevel.Medium,

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
                ?? DefaultMaxLessonsPerDayLimit,

            StudentGroupAvoidImmediateBuildingChange =
                preferences?.StudentGroupAvoidImmediateBuildingChange
                ?? SchedulingPreferenceLevel.Medium,

            ClassGroupMinimizeGaps =
                preferences?.ClassGroupMinimizeGaps
                ?? SchedulingPreferenceLevel.Medium,

            ClassGroupAvoidSingleLessonDay =
                preferences?.ClassGroupAvoidSingleLessonDay
                ?? SchedulingPreferenceLevel.Disabled,

            ClassGroupMaxConsecutiveLessons =
                preferences?.ClassGroupMaxConsecutiveLessons
                ?? SchedulingPreferenceLevel.Medium,

            ClassGroupMaxConsecutiveLessonsLimit =
                preferences?.ClassGroupMaxConsecutiveLessonsLimit
                ?? DefaultClassGroupMaxConsecutiveLessonsLimit,

            ClassGroupMaxLessonsPerDay =
                preferences?.ClassGroupMaxLessonsPerDay
                ?? SchedulingPreferenceLevel.High,

            ClassGroupMaxLessonsPerDayLimit =
                preferences?.ClassGroupMaxLessonsPerDayLimit
                ?? DefaultClassGroupMaxLessonsPerDayLimit,

            SubjectSpreadAcrossDays =
                preferences?.SubjectSpreadAcrossDays
                ?? SchedulingPreferenceLevel.Medium,

            SubjectMaxOccurrencesPerDay =
                preferences?.SubjectMaxOccurrencesPerDay
                ?? SchedulingPreferenceLevel.Medium,

            SubjectMaxOccurrencesPerDayLimit =
                preferences?.SubjectMaxOccurrencesPerDayLimit
                ?? DefaultSubjectMaxOccurrencesPerDayLimit,

            SubjectPreferDoubleLessons =
                preferences?.SubjectPreferDoubleLessons
                ?? SchedulingPreferenceLevel.Disabled,

            SubjectAvoidDoubleLessons =
                preferences?.SubjectAvoidDoubleLessons
                ?? SchedulingPreferenceLevel.Disabled
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

    private static bool IsEnabled(SchedulingPreferenceLevel value)
    {
        return value != SchedulingPreferenceLevel.Disabled;
    }
}
