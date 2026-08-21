using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.Subjects;
using TTOptimizer.Web.Models.DTO.ResourceTimeSlotPreferences;
using TTOptimizer.Web.Models.DTO.SchedulingPreferences;
using TTOptimizer.Web.Models.DTO.Import;
using TTOptimizer.Web.Services;

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
    public async Task<ActionResult<List<SubjectDTO>>> GetSubjects(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var subjects = await _db.Subjects
            .AsNoTracking()
            .Where(subject =>
                subject.OrganizationId == organizationId)
            .OrderBy(subject => subject.Name)
            .Select(subject => new SubjectDTO
            {
                Id = subject.Id,
                Name = subject.Name,
                Info = subject.Info
            })
            .ToListAsync();

        return Ok(subjects);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SubjectDTO>> GetSubject(
        int id,
        [FromQuery] int organizationId)
    {
        var subject = await GetSubjectDTOAsync(
            id,
            organizationId
        );

        if (subject == null)
        {
            return NotFound(new
            {
                message = "Subject not found."
            });
        }

        return Ok(subject);
    }

    [HttpPost]
    public async Task<ActionResult<SubjectDTO>> CreateSubject(
        [FromQuery] int organizationId,
        [FromBody] CreateSubjectRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var validationResult = ValidateRequest(
            request.Name,
            request.Info
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var subjectAlreadyExists =
            await _db.Subjects.AnyAsync(subject =>
                subject.OrganizationId == organizationId &&
                subject.Name.ToLower() ==
                    normalizedName.ToLower()
            );

        if (subjectAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Subject '{normalizedName}' already exists."
            });
        }

        var subject = new Subject
        {
            OrganizationId = organizationId,
            Name = normalizedName,
            Info = NormalizeOptionalText(request.Info)
        };

        _db.Subjects.Add(subject);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Subject '{normalizedName}' already exists."
            });
        }

        var result = await GetSubjectDTOAsync(
            subject.Id,
            organizationId
        );

        return CreatedAtAction(
            nameof(GetSubject),
            new
            {
                id = subject.Id,
                organizationId
            },
            result
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SubjectDTO>> UpdateSubject(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateSubjectRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var subject = await _db.Subjects
            .FirstOrDefaultAsync(subject =>
                subject.Id == id &&
                subject.OrganizationId == organizationId
            );

        if (subject == null)
        {
            return NotFound(new
            {
                message = "Subject not found."
            });
        }

        var validationResult = ValidateRequest(
            request.Name,
            request.Info
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var subjectAlreadyExists =
            await _db.Subjects.AnyAsync(otherSubject =>
                otherSubject.OrganizationId == organizationId &&
                otherSubject.Id != id &&
                otherSubject.Name.ToLower() ==
                    normalizedName.ToLower()
            );

        if (subjectAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Subject '{normalizedName}' already exists."
            });
        }

        subject.Name = normalizedName;
        subject.Info = NormalizeOptionalText(request.Info);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Subject '{normalizedName}' already exists."
            });
        }

        var result = await GetSubjectDTOAsync(
            subject.Id,
            organizationId
        );

        return Ok(result);
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
                    maxNameLength: 100);

            if (!preview.Success)
            {
                return BadRequest(preview);
            }

            return Ok(preview);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(
                $"Could not read subject import file: {error}");

            return BadRequest(new
            {
                success = false,
                message =
                    "The XLSX file could not be read. " +
                    "Make sure it is a valid spreadsheet."
            });
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportSubjects(
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
            await _db.Organizations.AnyAsync(
                organization => organization.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var requestedNames = request.Names
            .Select(name => name?.Trim() ?? string.Empty)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Where(name => name.Length <= 100)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requestedNames.Count == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "There are no valid subject names to import."
            });
        }

        var existingNames =
            await _db.Subjects
                .Where(subject =>
                    subject.OrganizationId == organizationId)
                .Select(subject => subject.Name)
                .ToListAsync();

        var existingNameSet = new HashSet<string>(
            existingNames,
            StringComparer.OrdinalIgnoreCase);

        var namesToImport = requestedNames
            .Where(name => !existingNameSet.Contains(name))
            .ToList();

        var skippedExistingCount =
            requestedNames.Count - namesToImport.Count;

        var subjectsToAdd = namesToImport
            .Select(name => new Subject
            {
                OrganizationId = organizationId,
                Name = name,
                Info = null
            })
            .ToList();

        if (subjectsToAdd.Count > 0)
        {
            _db.Subjects.AddRange(subjectsToAdd);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            success = true,
            importedCount = subjectsToAdd.Count,
            skippedExistingCount
        });
    }

    [HttpGet("{id:int}/time-slot-preferences")]
    public async Task<IActionResult> GetTimeSlotPreferences(
        int id,
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var subject = await _db.Subjects
            .AsNoTracking()
            .Where(item =>
                item.Id == id &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (subject == null)
        {
            return NotFound(new
            {
                message = "Subject not found."
            });
        }

        var timeSlotPreferences =
            await _db.SubjectTimeSlotPreferences
                .AsNoTracking()
                .Where(item => item.SubjectId == id)
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
            resourceType = "subject",
            resourceId = subject.Id,
            resourceName = subject.Name,
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
                message = "Organization ID is required."
            });
        }

        var resourceExists =
            await _db.Subjects.AnyAsync(item =>
                item.Id == id &&
                item.OrganizationId == organizationId);

        if (!resourceExists)
        {
            return NotFound(new
            {
                message = "Subject not found."
            });
        }

        if (request.TimeSlotPreferences == null)
        {
            return BadRequest(new
            {
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
            await _db.Database.BeginTransactionAsync();

        var existingPreferences =
            await _db.SubjectTimeSlotPreferences
                .Where(item => item.SubjectId == id)
                .ToListAsync();

        _db.SubjectTimeSlotPreferences.RemoveRange(existingPreferences);

        var newPreferences = normalizedPreferences
            .Select(slot => new SubjectTimeSlotPreference
            {
                SubjectId = id,
                DayIndex = slot.DayIndex,
                SlotIndex = slot.SlotIndex,
                PreferenceType = slot.PreferenceType
            })
            .ToList();

        _db.SubjectTimeSlotPreferences.AddRange(newPreferences);

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            message = "Subject time slot preferences were updated.",
            timeSlotPreferences = normalizedPreferences
                .OrderBy(slot => slot.DayIndex)
                .ThenBy(slot => slot.SlotIndex)
        });
    }


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

        var subject = await _db.Subjects
            .AsNoTracking()
            .Where(item =>
                item.Id == id &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (subject == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Subject was not found."
            });
        }

        var organizationDefaults =
            await _db.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        var subjectPreferences =
            await _db.SubjectSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.SubjectId == id);

        return Ok(new
        {
            success = true,
            preferences = CreateSubjectSchedulingPreferencesDto(
                subject.Id,
                subject.Name,
                organizationDefaults,
                subjectPreferences)
        });
    }

    [HttpPut("{id:int}/scheduling-preferences")]
    public async Task<IActionResult> UpdateSchedulingPreferences(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateSubjectSchedulingPreferencesRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        if (!IsValidOptionalLevel(request.SpreadAcrossDays) ||
            !IsValidOptionalLevel(request.MaxOccurrencesPerDay) ||
            !IsValidOptionalLevel(request.PreferDoubleLessons) ||
            !IsValidOptionalLevel(request.AvoidDoubleLessons))
        {
            return BadRequest(new
            {
                success = false,
                message = "One or more scheduling preference levels are invalid."
            });
        }

        if (!IsValidOptionalLimit(request.MaxOccurrencesPerDayLimit))
        {
            return BadRequest(new
            {
                success = false,
                message = "Maximum subject occurrences per day must be between 1 and 8 or left empty to use the organization default."
            });
        }

        var subject = await _db.Subjects
            .Where(item =>
                item.Id == id &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (subject == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Subject was not found."
            });
        }

        var organizationDefaults =
            await _db.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        var defaultPreferDouble =
            organizationDefaults?.SubjectPreferDoubleLessons
            ?? SchedulingPreferenceLevel.Disabled;

        var defaultAvoidDouble =
            organizationDefaults?.SubjectAvoidDoubleLessons
            ?? SchedulingPreferenceLevel.Disabled;

        var effectivePreferDouble =
            request.PreferDoubleLessons
            ?? defaultPreferDouble;

        var effectiveAvoidDouble =
            request.AvoidDoubleLessons
            ?? defaultAvoidDouble;

        if (IsEnabled(effectivePreferDouble) &&
            IsEnabled(effectiveAvoidDouble))
        {
            return BadRequest(new
            {
                success = false,
                message = "Prefer double lessons and avoid double lessons cannot both be enabled for the same subject."
            });
        }

        var preferences =
            await _db.SubjectSchedulingPreferences
                .FirstOrDefaultAsync(item =>
                    item.SubjectId == id);

        if (preferences == null)
        {
            preferences = new SubjectSchedulingPreferences
            {
                SubjectId = id
            };

            _db.SubjectSchedulingPreferences.Add(preferences);
        }

        preferences.SpreadAcrossDays =
            request.SpreadAcrossDays;

        preferences.MaxOccurrencesPerDay =
            request.MaxOccurrencesPerDay;

        preferences.MaxOccurrencesPerDayLimit =
            request.MaxOccurrencesPerDayLimit;

        preferences.PreferDoubleLessons =
            request.PreferDoubleLessons;

        preferences.AvoidDoubleLessons =
            request.AvoidDoubleLessons;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Subject scheduling preferences were saved.",
            preferences = CreateSubjectSchedulingPreferencesDto(
                subject.Id,
                subject.Name,
                organizationDefaults,
                preferences)
        });
    }

    private static SubjectSchedulingPreferencesDto
        CreateSubjectSchedulingPreferencesDto(
            int subjectId,
            string subjectName,
            OrganizationSchedulingPreferences? defaults,
            SubjectSchedulingPreferences? preferences)
    {
        var defaultSpreadAcrossDays =
            defaults?.SubjectSpreadAcrossDays
            ?? SchedulingPreferenceLevel.Medium;

        var defaultMaxOccurrencesPerDay =
            defaults?.SubjectMaxOccurrencesPerDay
            ?? SchedulingPreferenceLevel.Medium;

        var defaultMaxOccurrencesPerDayLimit =
            defaults?.SubjectMaxOccurrencesPerDayLimit
            ?? 1;

        var defaultPreferDoubleLessons =
            defaults?.SubjectPreferDoubleLessons
            ?? SchedulingPreferenceLevel.Disabled;

        var defaultAvoidDoubleLessons =
            defaults?.SubjectAvoidDoubleLessons
            ?? SchedulingPreferenceLevel.Disabled;

        return new SubjectSchedulingPreferencesDto
        {
            SubjectId = subjectId,
            SubjectName = subjectName,

            SpreadAcrossDays =
                preferences?.SpreadAcrossDays,
            DefaultSpreadAcrossDays =
                defaultSpreadAcrossDays,
            EffectiveSpreadAcrossDays =
                preferences?.SpreadAcrossDays
                ?? defaultSpreadAcrossDays,

            MaxOccurrencesPerDay =
                preferences?.MaxOccurrencesPerDay,
            DefaultMaxOccurrencesPerDay =
                defaultMaxOccurrencesPerDay,
            EffectiveMaxOccurrencesPerDay =
                preferences?.MaxOccurrencesPerDay
                ?? defaultMaxOccurrencesPerDay,

            MaxOccurrencesPerDayLimit =
                preferences?.MaxOccurrencesPerDayLimit,
            DefaultMaxOccurrencesPerDayLimit =
                defaultMaxOccurrencesPerDayLimit,
            EffectiveMaxOccurrencesPerDayLimit =
                preferences?.MaxOccurrencesPerDayLimit
                ?? defaultMaxOccurrencesPerDayLimit,

            PreferDoubleLessons =
                preferences?.PreferDoubleLessons,
            DefaultPreferDoubleLessons =
                defaultPreferDoubleLessons,
            EffectivePreferDoubleLessons =
                preferences?.PreferDoubleLessons
                ?? defaultPreferDoubleLessons,

            AvoidDoubleLessons =
                preferences?.AvoidDoubleLessons,
            DefaultAvoidDoubleLessons =
                defaultAvoidDoubleLessons,
            EffectiveAvoidDoubleLessons =
                preferences?.AvoidDoubleLessons
                ?? defaultAvoidDoubleLessons
        };
    }

    private static bool IsValidOptionalLevel(
        SchedulingPreferenceLevel? value)
    {
        return value == null || Enum.IsDefined(value.Value);
    }

    private static bool IsValidOptionalLimit(int? value)
    {
        return value == null || value is >= 1 and <= 8;
    }

    private static bool IsEnabled(
        SchedulingPreferenceLevel value)
    {
        return value != SchedulingPreferenceLevel.Disabled;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteSubject(
        int id,
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var subject = await _db.Subjects
            .FirstOrDefaultAsync(subject =>
                subject.Id == id &&
                subject.OrganizationId == organizationId
            );

        if (subject == null)
        {
            return NotFound(new
            {
                message = "Subject not found."
            });
        }

        var usedInLessonRequirements =
            await _db.LessonRequirements
                .AnyAsync(requirement =>
                    requirement.OrganizationId ==
                        organizationId &&
                    requirement.SubjectId == id
                );

        if (usedInLessonRequirements)
        {
            return Conflict(new
            {
                message =
                    "The subject cannot be deleted because it is " +
                    "used in lesson requirements."
            });
        }

        var usedByRooms = await _db.Rooms
            .AnyAsync(room =>
                room.OrganizationId == organizationId &&
                (
                    room.RestrictedToSubjectId == id ||
                    room.PreferredSubjectId == id
                )
            );

        if (usedByRooms)
        {
            return Conflict(new
            {
                message =
                    "The subject cannot be deleted because it is " +
                    "used by one or more rooms."
            });
        }

        _db.Subjects.Remove(subject);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private ActionResult? ValidateRequest(
        string? name,
        string? info)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Subject name is required."
            });
        }

        if (name.Trim().Length > 100)
        {
            return BadRequest(new
            {
                message =
                    "Subject name cannot contain more than " +
                    "100 characters."
            });
        }

        if (info?.Trim().Length > 2000)
        {
            return BadRequest(new
            {
                message =
                    "Subject information cannot contain more than " +
                    "2000 characters."
            });
        }

        return null;
    }

    private async Task<SubjectDTO?> GetSubjectDTOAsync(
        int id,
        int organizationId)
    {
        return await _db.Subjects
            .AsNoTracking()
            .Where(subject =>
                subject.Id == id &&
                subject.OrganizationId == organizationId)
            .Select(subject => new SubjectDTO
            {
                Id = subject.Id,
                Name = subject.Name,
                Info = subject.Info
            })
            .FirstOrDefaultAsync();
    }

    private static string? NormalizeOptionalText(
        string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}