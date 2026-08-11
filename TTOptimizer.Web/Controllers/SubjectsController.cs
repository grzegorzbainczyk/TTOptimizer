using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.Subjects;
using TTOptimizer.Web.Models.DTO.ResourceTimeSlotPreferences;

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