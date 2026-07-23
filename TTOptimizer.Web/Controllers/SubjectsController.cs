using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.Subjects;

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