using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.ClassGroups;
using TTOptimizer.Web.Models.DTO.ResourceAvailability;

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
    public async Task<ActionResult<List<ClassGroupDTO>>> GetClasses(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var classes = await _db.ClassGroups
            .AsNoTracking()
            .Where(classGroup =>
                classGroup.OrganizationId == organizationId)
            .OrderBy(classGroup => classGroup.Name)
            .Select(classGroup => new ClassGroupDTO
            {
                Id = classGroup.Id,
                Name = classGroup.Name,
                Info = classGroup.Info,

                HomeroomTeacherId =
                    classGroup.HomeroomTeacherId,

                HomeroomTeacherName =
                    classGroup.HomeroomTeacher != null
                        ? classGroup.HomeroomTeacher.Name
                        : null,

                DefaultRoomId =
                    classGroup.DefaultRoomId,

                DefaultRoomName =
                    classGroup.DefaultRoom != null
                        ? classGroup.DefaultRoom.Name
                        : null
            })
            .ToListAsync();

        return Ok(classes);
    }

    [HttpPost]
    public async Task<ActionResult<ClassGroupDTO>> CreateClass(
        [FromQuery] int organizationId,
        [FromBody] CreateClassGroupRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var validationResult = await ValidateRequestAsync(
            organizationId,
            request.Name,
            request.HomeroomTeacherId,
            request.DefaultRoomId
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var nameAlreadyExists = await _db.ClassGroups
            .AnyAsync(classGroup =>
                classGroup.OrganizationId == organizationId &&
                classGroup.Name.ToLower() ==
                normalizedName.ToLower()
            );

        if (nameAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        var classGroup = new ClassGroup
        {
            OrganizationId = organizationId,
            Name = normalizedName,
            Info = NormalizeOptionalText(request.Info),
            HomeroomTeacherId = request.HomeroomTeacherId,
            DefaultRoomId = request.DefaultRoomId
        };

        _db.ClassGroups.Add(classGroup);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        var result = await GetClassDTOAsync(
            classGroup.Id,
            organizationId
        );

        return CreatedAtAction(
            nameof(GetClass),
            new
            {
                id = classGroup.Id,
                organizationId
            },
            result
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClassGroupDTO>> GetClass(
        int id,
        [FromQuery] int organizationId)
    {
        var classGroup = await GetClassDTOAsync(
            id,
            organizationId
        );

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        return Ok(classGroup);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClassGroupDTO>> UpdateClass(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateClassGroupRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var classGroup = await _db.ClassGroups
            .FirstOrDefaultAsync(classGroup =>
                classGroup.Id == id &&
                classGroup.OrganizationId == organizationId
            );

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        var validationResult = await ValidateRequestAsync(
            organizationId,
            request.Name,
            request.HomeroomTeacherId,
            request.DefaultRoomId
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var nameAlreadyExists = await _db.ClassGroups
            .AnyAsync(otherClassGroup =>
                otherClassGroup.OrganizationId ==
                    organizationId &&
                otherClassGroup.Id != id &&
                otherClassGroup.Name.ToLower() ==
                    normalizedName.ToLower()
            );

        if (nameAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        classGroup.Name = normalizedName;
        classGroup.Info =
            NormalizeOptionalText(request.Info);

        classGroup.HomeroomTeacherId =
            request.HomeroomTeacherId;

        classGroup.DefaultRoomId =
            request.DefaultRoomId;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        var result = await GetClassDTOAsync(
            classGroup.Id,
            organizationId
        );

        return Ok(result);
    }

    [HttpGet("{id:int}/availability")]
    public async Task<IActionResult> GetAvailability(
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

        var classGroup = await _db.ClassGroups
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

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        var unavailableSlots =
            await _db.ClassGroupUnavailabilities
                .AsNoTracking()
                .Where(item =>
                    item.ClassGroupId == id)
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
            resourceType = "class",
            resourceId = classGroup.Id,
            resourceName = classGroup.Name,
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
                message = "Organization ID is required."
            });
        }

        var classExists =
            await _db.ClassGroups.AnyAsync(item =>
                item.Id == id &&
                item.OrganizationId == organizationId);

        if (!classExists)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        if (request.UnavailableSlots == null)
        {
            return BadRequest(new
            {
                message =
                    "Unavailable slots collection is required."
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
            await _db.Database.BeginTransactionAsync();

        var existingSlots =
            await _db.ClassGroupUnavailabilities
                .Where(item =>
                    item.ClassGroupId == id)
                .ToListAsync();

        _db.ClassGroupUnavailabilities.RemoveRange(
            existingSlots
        );

        var newSlots = normalizedSlots
            .Select(slot => new ClassGroupUnavailability
            {
                ClassGroupId = id,
                DayIndex = slot.DayIndex,
                SlotIndex = slot.SlotIndex
            })
            .ToList();

        _db.ClassGroupUnavailabilities.AddRange(
            newSlots
        );

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            success = true,
            message = "Class availability was updated.",
            unavailableSlots = normalizedSlots
                .OrderBy(slot => slot.DayIndex)
                .ThenBy(slot => slot.SlotIndex)
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteClass(
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

        var classGroup = await _db.ClassGroups
            .FirstOrDefaultAsync(classGroup =>
                classGroup.Id == id &&
                classGroup.OrganizationId == organizationId
            );

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        var isUsedInRequirements =
            await _db.LessonRequirements
                .AnyAsync(requirement =>
                    requirement.OrganizationId ==
                        organizationId &&
                    requirement.ClassGroupId == id
                );

        if (isUsedInRequirements)
        {
            return Conflict(new
            {
                message =
                    "The class cannot be deleted because it is " +
                    "used in lesson requirements."
            });
        }

        _db.ClassGroups.Remove(classGroup);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?> ValidateRequestAsync(
        int organizationId,
        string? name,
        int? homeroomTeacherId,
        int? defaultRoomId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Class name is required."
            });
        }

        if (name.Trim().Length > 50)
        {
            return BadRequest(new
            {
                message =
                    "Class name cannot contain more than 50 characters."
            });
        }

        if (homeroomTeacherId.HasValue)
        {
            var teacherExists = await _db.Teachers
                .AnyAsync(teacher =>
                    teacher.Id == homeroomTeacherId.Value &&
                    teacher.OrganizationId == organizationId
                );

            if (!teacherExists)
            {
                return BadRequest(new
                {
                    message =
                        "The selected homeroom teacher does not exist."
                });
            }
        }

        if (defaultRoomId.HasValue)
        {
            var roomExists = await _db.Rooms
                .AnyAsync(room =>
                    room.Id == defaultRoomId.Value &&
                    room.OrganizationId == organizationId
                );

            if (!roomExists)
            {
                return BadRequest(new
                {
                    message =
                        "The selected default room does not exist."
                });
            }
        }

        return null;
    }

    private async Task<ClassGroupDTO?> GetClassDTOAsync(
        int id,
        int organizationId)
    {
        return await _db.ClassGroups
            .AsNoTracking()
            .Where(classGroup =>
                classGroup.Id == id &&
                classGroup.OrganizationId == organizationId)
            .Select(classGroup => new ClassGroupDTO
            {
                Id = classGroup.Id,
                Name = classGroup.Name,
                Info = classGroup.Info,

                HomeroomTeacherId =
                    classGroup.HomeroomTeacherId,

                HomeroomTeacherName =
                    classGroup.HomeroomTeacher != null
                        ? classGroup.HomeroomTeacher.Name
                        : null,

                DefaultRoomId =
                    classGroup.DefaultRoomId,

                DefaultRoomName =
                    classGroup.DefaultRoom != null
                        ? classGroup.DefaultRoom.Name
                        : null
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