using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.ResourceAvailability;
using TTOptimizer.Web.Models.DTO.Teachers;

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


    // Availability endpoint for a specific teacher

    [HttpGet("{id:int}/availability")]
    public async Task<IActionResult> GetAvailability(
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

        var unavailableSlots =
            await _dbContext.TeacherUnavailabilities
                .AsNoTracking()
                .Where(item =>
                    item.TeacherId == id)
                .OrderBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new AvailabilitySlotDTO
                {
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex
                })
                .ToListAsync();

        return Ok(new
        {
            success = true,
            resourceType = "teacher",
            resourceId = teacher.Id,
            resourceName = teacher.Name,
            unavailableSlots
        });
    }

    [HttpPut("{id:int}/availability")]
    public async Task<IActionResult> UpdateAvailability(
    int id,
    [FromQuery] int organizationId,
    [FromBody] UpdateAvailabilityRequest request)
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

        if (request.UnavailableSlots == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Unavailable slots collection is required."
            });
        }

        var invalidSlot = request.UnavailableSlots
            .FirstOrDefault(slot =>
                slot.DayIndex < 0 ||
                slot.DayIndex > 4 ||
                slot.SlotIndex < 0 ||
                slot.SlotIndex > 7);

        if (invalidSlot != null)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Day index must be between 0 and 4, " +
                    "and slot index between 0 and 7."
            });
        }

        var normalizedSlots = request.UnavailableSlots
            .GroupBy(slot => new
            {
                slot.DayIndex,
                slot.SlotIndex
            })
            .Select(group => group.First())
            .ToList();

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync();

        var existingSlots =
            await _dbContext.TeacherUnavailabilities
                .Where(item =>
                    item.TeacherId == id)
                .ToListAsync();

        _dbContext.TeacherUnavailabilities.RemoveRange(
            existingSlots
        );

        var newSlots = normalizedSlots
            .Select(slot => new TeacherUnavailability
            {
                TeacherId = id,
                DayIndex = slot.DayIndex,
                SlotIndex = slot.SlotIndex
            })
            .ToList();

        _dbContext.TeacherUnavailabilities.AddRange(
            newSlots
        );

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            success = true,
            message = "Teacher availability was updated.",
            unavailableSlots = normalizedSlots
                .OrderBy(slot => slot.DayIndex)
                .ThenBy(slot => slot.SlotIndex)
        });
    }
}