using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.ResourceTimeSlotPreferences;
using TTOptimizer.Web.Models.DTO.Teachers;
using TTOptimizer.Web.Models.DTO.Import;
using TTOptimizer.Web.Models.DTO.SchedulingPreferences;
using TTOptimizer.Web.Services;

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
    public async Task<IActionResult> GetAll(
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

        var teachers = await _dbContext.Teachers
            .Where(t => t.OrganizationId == organizationId)
            .OrderBy(t => t.TeacherNumber)
            .Select(t => new TeacherDto
            {
                Id = t.Id,
                TeacherNumber = t.TeacherNumber,
                Name = t.Name,
                Alias = t.Alias,
                Info = t.Info
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            teachers
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
    [FromQuery] int organizationId,
    [FromBody] CreateTeacherRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organizationExists =
            await _dbContext.Organizations.AnyAsync(
                o => o.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                success = false,
                message = "Teacher name is required."
            });
        }

        var nextTeacherNumber =
            (await _dbContext.Teachers
                .Where(t => t.OrganizationId == organizationId)
                .MaxAsync(t => (int?)t.TeacherNumber) ?? 0) + 1;

        var alias = string.IsNullOrWhiteSpace(request.Alias)
            ? await GenerateUniqueAliasAsync(
                organizationId,
                name)
            : request.Alias.Trim().ToUpperInvariant();

        var aliasExists = await _dbContext.Teachers.AnyAsync(
            t => t.OrganizationId == organizationId &&
                 t.Alias == alias);

        if (aliasExists)
        {
            return Conflict(new
            {
                success = false,
                message = $"Teacher alias '{alias}' already exists."
            });
        }

        var teacher = new Teacher
        {
            OrganizationId = organizationId,
            TeacherNumber = nextTeacherNumber,
            Name = name,
            Alias = alias,
            Info = string.IsNullOrWhiteSpace(request.Info)
                ? null
                : request.Info.Trim()
        };

        _dbContext.Teachers.Add(teacher);
        await _dbContext.SaveChangesAsync();

        var teacherDto = new TeacherDto
        {
            Id = teacher.Id,
            TeacherNumber = teacher.TeacherNumber,
            Name = teacher.Name,
            Alias = teacher.Alias,
            Info = teacher.Info
        };

        return CreatedAtAction(
            nameof(GetAll),
            new { organizationId },
            new
            {
                success = true,
                teacher = teacherDto
            });
    }

    private async Task<string> GenerateUniqueAliasAsync(
    int organizationId,
    string name)
    {
        var parts = name.Split(
            ' ',
            StringSplitOptions.RemoveEmptyEntries |
            StringSplitOptions.TrimEntries);

        var baseAlias = string.Concat(
            parts.Select(part =>
                char.ToUpperInvariant(part[0])));

        if (string.IsNullOrWhiteSpace(baseAlias))
        {
            baseAlias = "T";
        }

        var alias = baseAlias;
        var suffix = 2;

        while (await _dbContext.Teachers.AnyAsync(
            teacher =>
                teacher.OrganizationId == organizationId &&
                teacher.Alias == alias))
        {
            alias = $"{baseAlias}{suffix}";
            suffix++;
        }

        return alias;
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
    int id,
    [FromQuery] int organizationId,
    [FromBody] UpdateTeacherRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var teacher = await _dbContext.Teachers
            .FirstOrDefaultAsync(t =>
                t.Id == id &&
                t.OrganizationId == organizationId);

        if (teacher == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Teacher was not found."
            });
        }

        var name = request.Name.Trim();
        var alias = request.Alias.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                success = false,
                message = "Teacher name is required."
            });
        }

        if (string.IsNullOrWhiteSpace(alias))
        {
            return BadRequest(new
            {
                success = false,
                message = "Teacher alias is required."
            });
        }

        var aliasExists = await _dbContext.Teachers.AnyAsync(t =>
            t.OrganizationId == organizationId &&
            t.Id != id &&
            t.Alias == alias);

        if (aliasExists)
        {
            return Conflict(new
            {
                success = false,
                message = $"Teacher alias '{alias}' already exists."
            });
        }

        teacher.Name = name;
        teacher.Alias = alias;
        teacher.Info = string.IsNullOrWhiteSpace(request.Info)
            ? null
            : request.Info.Trim();

        await _dbContext.SaveChangesAsync();

        var teacherDto = new TeacherDto
        {
            Id = teacher.Id,
            TeacherNumber = teacher.TeacherNumber,
            Name = teacher.Name,
            Alias = teacher.Alias,
            Info = teacher.Info
        };

        return Ok(new
        {
            success = true,
            teacher = teacherDto
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
    int id,
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

        var teacher = await _dbContext.Teachers
            .FirstOrDefaultAsync(t =>
                t.Id == id &&
                t.OrganizationId == organizationId);

        if (teacher == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Teacher was not found."
            });
        }

        var isUsedInLessonRequirements =
            await _dbContext.LessonRequirements.AnyAsync(lr =>
                lr.OrganizationId == organizationId &&
                lr.TeacherId == id);

        if (isUsedInLessonRequirements)
        {
            return Conflict(new
            {
                success = false,
                message =
                    "Cannot delete this teacher because lesson requirements use it."
            });
        }

        _dbContext.Teachers.Remove(teacher);
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Teacher was deleted."
        });
    }




    [HttpPost("import")]
    public async Task<IActionResult> ImportTeachers(
        [FromQuery] int organizationId,
        [FromBody] SimpleNameImportRequestDto request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organizationExists =
            await _dbContext.Organizations.AnyAsync(
                organization => organization.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        if (request.Names == null || request.Names.Count == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "There are no teachers to import."
            });
        }

        var requestedNames = request.Names
            .Select(name => name?.Trim() ?? string.Empty)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requestedNames.Count == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "There are no valid teacher names to import."
            });
        }

        var existingTeachers =
            await _dbContext.Teachers
                .Where(teacher =>
                    teacher.OrganizationId == organizationId)
                .Select(teacher => new
                {
                    teacher.Name,
                    teacher.Alias
                })
                .ToListAsync();

        var existingNames = new HashSet<string>(
            existingTeachers.Select(teacher => teacher.Name),
            StringComparer.OrdinalIgnoreCase);

        var usedAliases = new HashSet<string>(
            existingTeachers.Select(teacher => teacher.Alias),
            StringComparer.OrdinalIgnoreCase);

        var namesToImport = requestedNames
            .Where(name => !existingNames.Contains(name))
            .ToList();

        var skippedExistingCount =
            requestedNames.Count - namesToImport.Count;

        if (namesToImport.Count == 0)
        {
            return Ok(new
            {
                success = true,
                importedCount = 0,
                skippedExistingCount,
                message = "No new teachers were imported."
            });
        }

        var nextTeacherNumber =
            (await _dbContext.Teachers
                .Where(teacher =>
                    teacher.OrganizationId == organizationId)
                .MaxAsync(teacher =>
                    (int?)teacher.TeacherNumber) ?? 0) + 1;

        var teachers = new List<Teacher>();

        foreach (var name in namesToImport)
        {
            var alias =
                GenerateUniqueAliasForImport(
                    name,
                    usedAliases);

            var teacher = new Teacher
            {
                OrganizationId = organizationId,
                TeacherNumber = nextTeacherNumber++,
                Name = name,
                Alias = alias,
                Info = null
            };

            teachers.Add(teacher);
        }

        _dbContext.Teachers.AddRange(teachers);
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            importedCount = teachers.Count,
            skippedExistingCount,
            message = $"{teachers.Count} teacher(s) imported."
        });
    }

    private static string GenerateUniqueAliasForImport(
        string name,
        HashSet<string> usedAliases)
    {
        var parts = name.Split(
            ' ',
            StringSplitOptions.RemoveEmptyEntries |
            StringSplitOptions.TrimEntries);

        var baseAlias = string.Concat(
            parts.Select(part =>
                char.ToUpperInvariant(part[0])));

        if (string.IsNullOrWhiteSpace(baseAlias))
        {
            baseAlias = "T";
        }

        var alias = baseAlias;
        var suffix = 2;

        while (usedAliases.Contains(alias))
        {
            alias = $"{baseAlias}{suffix}";
            suffix++;
        }

        usedAliases.Add(alias);

        return alias;
    }

    [HttpPost("import/preview")]
    public IActionResult PreviewImport(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "File is required."
            });
        }

        var extension = Path.GetExtension(file.FileName);

        if (!string.Equals(
            extension,
            ".xlsx",
            StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                success = false,
                message = "Only .xlsx files are supported."
            });
        }

        try
        {
            using var stream = file.OpenReadStream();

            var preview =
                XlsxImportService.ReadSingleNameColumnPreview(
                    stream,
                    expectedHeader: "Name",
                    maxNameLength: 200);

            if (!preview.Success)
            {
                return BadRequest(preview);
            }

            return Ok(preview);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(
                $"Could not read teacher import file: {error}");

            return BadRequest(new
            {
                success = false,
                message =
                    "The XLSX file could not be read. " +
                    "Make sure it is a valid spreadsheet."
            });
        }
    }

    // Time slot preferences endpoint for a specific teacher

    [HttpGet("{id:int}/time-slot-preferences")]
    public async Task<IActionResult> GetTimeSlotPreferences(
        int id,
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

        var teacher = await _dbContext.Teachers
            .AsNoTracking()
            .Where(t =>
                t.Id == id &&
                t.OrganizationId == organizationId)
            .Select(t => new
            {
                t.Id,
                t.Name
            })
            .FirstOrDefaultAsync();

        if (teacher == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Teacher was not found."
            });
        }

        var timeSlotPreferences =
            await _dbContext.TeacherTimeSlotPreferences
                .AsNoTracking()
                .Where(item => item.TeacherId == id)
                .OrderBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new TimeSlotPreferenceDTO
                {
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex,
                    PreferenceType = item.PreferenceType
                })
                .ToListAsync();

        return Ok(new
        {
            success = true,
            resourceType = "teacher",
            resourceId = teacher.Id,
            resourceName = teacher.Name,
            timeSlotPreferences
        });
    }

    [HttpPut("{id:int}/time-slot-preferences")]
    public async Task<IActionResult> UpdateTimeSlotPreferences(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateTimeSlotPreferencesRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var teacherExists =
            await _dbContext.Teachers.AnyAsync(t =>
                t.Id == id &&
                t.OrganizationId == organizationId);

        if (!teacherExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Teacher was not found."
            });
        }

        if (request.TimeSlotPreferences == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Time slot preferences collection is required."
            });
        }

        var invalidSlot = request.TimeSlotPreferences
            .FirstOrDefault(slot =>
                slot.DayIndex < 0 ||
                slot.DayIndex > 4 ||
                slot.SlotIndex < 0 ||
                slot.SlotIndex > 7 ||
                !Enum.IsDefined(slot.PreferenceType));

        if (invalidSlot != null)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Day index must be between 0 and 4, slot index between 0 and 7, " +
                    "and preference type must be valid."
            });
        }

        var normalizedPreferences = request.TimeSlotPreferences
            .GroupBy(slot => new
            {
                slot.DayIndex,
                slot.SlotIndex
            })
            .Select(group => group.First())
            .ToList();

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync();

        var existingPreferences =
            await _dbContext.TeacherTimeSlotPreferences
                .Where(item => item.TeacherId == id)
                .ToListAsync();

        _dbContext.TeacherTimeSlotPreferences.RemoveRange(
            existingPreferences);

        var newPreferences = normalizedPreferences
            .Select(slot => new TeacherTimeSlotPreference
            {
                TeacherId = id,
                DayIndex = slot.DayIndex,
                SlotIndex = slot.SlotIndex,
                PreferenceType = slot.PreferenceType
            })
            .ToList();

        _dbContext.TeacherTimeSlotPreferences.AddRange(
            newPreferences);

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            success = true,
            message = "Teacher time slot preferences were updated.",
            timeSlotPreferences = normalizedPreferences
                .OrderBy(slot => slot.DayIndex)
                .ThenBy(slot => slot.SlotIndex)
        });
    }

    // Scheduling preferences endpoint for a specific teacher

    [HttpGet("{id:int}/scheduling-preferences")]
    public async Task<IActionResult> GetSchedulingPreferences(
        int id,
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

        var teacher = await _dbContext.Teachers
            .AsNoTracking()
            .Where(t =>
                t.Id == id &&
                t.OrganizationId == organizationId)
            .Select(t => new
            {
                t.Id,
                t.Name
            })
            .FirstOrDefaultAsync();

        if (teacher == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Teacher was not found."
            });
        }

        var organizationPreferences =
            await _dbContext.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        var teacherPreferences =
            await _dbContext.TeacherSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.TeacherId == id);

        return Ok(new
        {
            success = true,
            preferences = CreateTeacherSchedulingPreferencesDto(
                teacher.Id,
                teacher.Name,
                organizationPreferences,
                teacherPreferences)
        });
    }

    [HttpPut("{id:int}/scheduling-preferences")]
    public async Task<IActionResult> UpdateSchedulingPreferences(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateTeacherSchedulingPreferencesRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var teacher = await _dbContext.Teachers
            .Where(t =>
                t.Id == id &&
                t.OrganizationId == organizationId)
            .Select(t => new
            {
                t.Id,
                t.Name
            })
            .FirstOrDefaultAsync();

        if (teacher == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Teacher was not found."
            });
        }

        if (!IsValidOptionalLevel(request.MinimizeGaps) ||
            !IsValidOptionalLevel(request.AvoidSingleLessonDay) ||
            !IsValidOptionalLevel(request.MaxConsecutiveLessons) ||
            !IsValidOptionalLevel(request.MaxLessonsPerDay))
        {
            return BadRequest(new
            {
                success = false,
                message = "One or more scheduling preference levels are invalid."
            });
        }

        if (!IsValidOptionalLimit(request.MaxConsecutiveLessonsLimit) ||
            !IsValidOptionalLimit(request.MaxLessonsPerDayLimit))
        {
            return BadRequest(new
            {
                success = false,
                message = "Lesson limits must be between 1 and 8, or null to use the organization default."
            });
        }

        var preferences =
            await _dbContext.TeacherSchedulingPreferences
                .FirstOrDefaultAsync(item =>
                    item.TeacherId == id);

        if (preferences == null)
        {
            preferences = new TeacherSchedulingPreferences
            {
                TeacherId = id
            };

            _dbContext.TeacherSchedulingPreferences.Add(
                preferences);
        }

        preferences.MinimizeGaps =
            request.MinimizeGaps;

        preferences.AvoidSingleLessonDay =
            request.AvoidSingleLessonDay;

        preferences.MaxConsecutiveLessons =
            request.MaxConsecutiveLessons;

        preferences.MaxConsecutiveLessonsLimit =
            request.MaxConsecutiveLessonsLimit;

        preferences.MaxLessonsPerDay =
            request.MaxLessonsPerDay;

        preferences.MaxLessonsPerDayLimit =
            request.MaxLessonsPerDayLimit;

        await _dbContext.SaveChangesAsync();

        var organizationPreferences =
            await _dbContext.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        return Ok(new
        {
            success = true,
            message = "Teacher scheduling preferences were updated.",
            preferences = CreateTeacherSchedulingPreferencesDto(
                teacher.Id,
                teacher.Name,
                organizationPreferences,
                preferences)
        });
    }

    private static TeacherSchedulingPreferencesDto
        CreateTeacherSchedulingPreferencesDto(
            int teacherId,
            string teacherName,
            OrganizationSchedulingPreferences? organizationPreferences,
            TeacherSchedulingPreferences? teacherPreferences)
    {
        var defaultMinimizeGaps =
            organizationPreferences?.TeacherMinimizeGaps
            ?? SchedulingPreferenceLevel.Medium;

        var defaultAvoidSingleLessonDay =
            organizationPreferences?.TeacherAvoidSingleLessonDay
            ?? SchedulingPreferenceLevel.Low;

        var defaultMaxConsecutiveLessons =
            organizationPreferences?.TeacherMaxConsecutiveLessons
            ?? SchedulingPreferenceLevel.Medium;

        var defaultMaxConsecutiveLessonsLimit =
            organizationPreferences?.TeacherMaxConsecutiveLessonsLimit
            ?? 4;

        var defaultMaxLessonsPerDay =
            organizationPreferences?.TeacherMaxLessonsPerDay
            ?? SchedulingPreferenceLevel.Medium;

        var defaultMaxLessonsPerDayLimit =
            organizationPreferences?.TeacherMaxLessonsPerDayLimit
            ?? 6;

        return new TeacherSchedulingPreferencesDto
        {
            TeacherId = teacherId,
            TeacherName = teacherName,

            MinimizeGaps =
                teacherPreferences?.MinimizeGaps,
            DefaultMinimizeGaps =
                defaultMinimizeGaps,
            EffectiveMinimizeGaps =
                teacherPreferences?.MinimizeGaps
                ?? defaultMinimizeGaps,

            AvoidSingleLessonDay =
                teacherPreferences?.AvoidSingleLessonDay,
            DefaultAvoidSingleLessonDay =
                defaultAvoidSingleLessonDay,
            EffectiveAvoidSingleLessonDay =
                teacherPreferences?.AvoidSingleLessonDay
                ?? defaultAvoidSingleLessonDay,

            MaxConsecutiveLessons =
                teacherPreferences?.MaxConsecutiveLessons,
            DefaultMaxConsecutiveLessons =
                defaultMaxConsecutiveLessons,
            EffectiveMaxConsecutiveLessons =
                teacherPreferences?.MaxConsecutiveLessons
                ?? defaultMaxConsecutiveLessons,

            MaxConsecutiveLessonsLimit =
                teacherPreferences?.MaxConsecutiveLessonsLimit,
            DefaultMaxConsecutiveLessonsLimit =
                defaultMaxConsecutiveLessonsLimit,
            EffectiveMaxConsecutiveLessonsLimit =
                teacherPreferences?.MaxConsecutiveLessonsLimit
                ?? defaultMaxConsecutiveLessonsLimit,

            MaxLessonsPerDay =
                teacherPreferences?.MaxLessonsPerDay,
            DefaultMaxLessonsPerDay =
                defaultMaxLessonsPerDay,
            EffectiveMaxLessonsPerDay =
                teacherPreferences?.MaxLessonsPerDay
                ?? defaultMaxLessonsPerDay,

            MaxLessonsPerDayLimit =
                teacherPreferences?.MaxLessonsPerDayLimit,
            DefaultMaxLessonsPerDayLimit =
                defaultMaxLessonsPerDayLimit,
            EffectiveMaxLessonsPerDayLimit =
                teacherPreferences?.MaxLessonsPerDayLimit
                ?? defaultMaxLessonsPerDayLimit
        };
    }

    private static bool IsValidOptionalLevel(
        SchedulingPreferenceLevel? value)
    {
        return !value.HasValue ||
            Enum.IsDefined(value.Value);
    }

    private static bool IsValidOptionalLimit(
        int? value)
    {
        return !value.HasValue ||
            value.Value is >= 1 and <= 8;
    }
}
