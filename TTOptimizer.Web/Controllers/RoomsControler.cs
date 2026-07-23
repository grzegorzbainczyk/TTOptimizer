using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.Rooms;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoomsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<RoomDTO>>> GetRooms(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var rooms = await _db.Rooms
            .AsNoTracking()
            .Where(room =>
                room.OrganizationId == organizationId)
            .OrderBy(room => room.Name)
            .Select(room => new RoomDTO
            {
                Id = room.Id,
                Name = room.Name,
                Info = room.Info,

                RestrictedToSubjectId =
                    room.RestrictedToSubjectId,

                RestrictedToSubjectName =
                    room.RestrictedToSubject != null
                        ? room.RestrictedToSubject.Name
                        : null,

                PreferredSubjectId =
                    room.PreferredSubjectId,

                PreferredSubjectName =
                    room.PreferredSubject != null
                        ? room.PreferredSubject.Name
                        : null
            })
            .ToListAsync();

        return Ok(rooms);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoomDTO>> GetRoom(
        int id,
        [FromQuery] int organizationId)
    {
        var room = await GetRoomDTOAsync(
            id,
            organizationId
        );

        if (room == null)
        {
            return NotFound(new
            {
                message = "Room not found."
            });
        }

        return Ok(room);
    }

    [HttpPost]
    public async Task<ActionResult<RoomDTO>> CreateRoom(
        [FromQuery] int organizationId,
        [FromBody] CreateRoomRequest request)
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
            request.Info,
            request.RestrictedToSubjectId,
            request.PreferredSubjectId
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var roomAlreadyExists = await _db.Rooms
            .AnyAsync(room =>
                room.OrganizationId == organizationId &&
                room.Name.ToLower() ==
                normalizedName.ToLower()
            );

        if (roomAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Room '{normalizedName}' already exists."
            });
        }

        var room = new Room
        {
            OrganizationId = organizationId,
            Name = normalizedName,
            Info = NormalizeOptionalText(request.Info),

            RestrictedToSubjectId =
                request.RestrictedToSubjectId,

            PreferredSubjectId =
                request.PreferredSubjectId
        };

        _db.Rooms.Add(room);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Room '{normalizedName}' already exists."
            });
        }

        var result = await GetRoomDTOAsync(
            room.Id,
            organizationId
        );

        return CreatedAtAction(
            nameof(GetRoom),
            new
            {
                id = room.Id,
                organizationId
            },
            result
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RoomDTO>> UpdateRoom(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateRoomRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var room = await _db.Rooms
            .FirstOrDefaultAsync(room =>
                room.Id == id &&
                room.OrganizationId == organizationId
            );

        if (room == null)
        {
            return NotFound(new
            {
                message = "Room not found."
            });
        }

        var validationResult = await ValidateRequestAsync(
            organizationId,
            request.Name,
            request.Info,
            request.RestrictedToSubjectId,
            request.PreferredSubjectId
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var roomAlreadyExists = await _db.Rooms
            .AnyAsync(otherRoom =>
                otherRoom.OrganizationId ==
                    organizationId &&
                otherRoom.Id != id &&
                otherRoom.Name.ToLower() ==
                    normalizedName.ToLower()
            );

        if (roomAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Room '{normalizedName}' already exists."
            });
        }

        room.Name = normalizedName;
        room.Info = NormalizeOptionalText(request.Info);

        room.RestrictedToSubjectId =
            request.RestrictedToSubjectId;

        room.PreferredSubjectId =
            request.PreferredSubjectId;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Room '{normalizedName}' already exists."
            });
        }

        var result = await GetRoomDTOAsync(
            room.Id,
            organizationId
        );

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRoom(
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

        var room = await _db.Rooms
            .FirstOrDefaultAsync(room =>
                room.Id == id &&
                room.OrganizationId == organizationId
            );

        if (room == null)
        {
            return NotFound(new
            {
                message = "Room not found."
            });
        }

        var usedAsDefaultRoom = await _db.ClassGroups
            .AnyAsync(classGroup =>
                classGroup.OrganizationId ==
                    organizationId &&
                classGroup.DefaultRoomId == id
            );

        if (usedAsDefaultRoom)
        {
            return Conflict(new
            {
                message =
                    "The room cannot be deleted because it is " +
                    "assigned as a default room to a class."
            });
        }

        var usedInScheduledLessons =
            await _db.ScheduledLessons
            .AnyAsync(lesson =>
            lesson.RoomId == id
        );

        if (usedInScheduledLessons)
        {
            return Conflict(new
            {
                message =
                    "The room cannot be deleted because it is " +
                    "used in an existing schedule."
            });
        }

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?> ValidateRequestAsync(
        int organizationId,
        string? name,
        string? info,
        int? restrictedToSubjectId,
        int? preferredSubjectId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Room name is required."
            });
        }

        if (name.Trim().Length > 100)
        {
            return BadRequest(new
            {
                message =
                    "Room name cannot contain more than 100 characters."
            });
        }

        if (info?.Trim().Length > 2000)
        {
            return BadRequest(new
            {
                message =
                    "Room information cannot contain more than " +
                    "2000 characters."
            });
        }

        if (restrictedToSubjectId.HasValue)
        {
            var subjectExists = await _db.Subjects
                .AnyAsync(subject =>
                    subject.Id ==
                        restrictedToSubjectId.Value &&
                    subject.OrganizationId ==
                        organizationId
                );

            if (!subjectExists)
            {
                return BadRequest(new
                {
                    message =
                        "The restricted subject does not exist."
                });
            }
        }

        if (preferredSubjectId.HasValue)
        {
            var subjectExists = await _db.Subjects
                .AnyAsync(subject =>
                    subject.Id ==
                        preferredSubjectId.Value &&
                    subject.OrganizationId ==
                        organizationId
                );

            if (!subjectExists)
            {
                return BadRequest(new
                {
                    message =
                        "The preferred subject does not exist."
                });
            }
        }

        return null;
    }

    private async Task<RoomDTO?> GetRoomDTOAsync(
        int id,
        int organizationId)
    {
        return await _db.Rooms
            .AsNoTracking()
            .Where(room =>
                room.Id == id &&
                room.OrganizationId == organizationId)
            .Select(room => new RoomDTO
            {
                Id = room.Id,
                Name = room.Name,
                Info = room.Info,

                RestrictedToSubjectId =
                    room.RestrictedToSubjectId,

                RestrictedToSubjectName =
                    room.RestrictedToSubject != null
                        ? room.RestrictedToSubject.Name
                        : null,

                PreferredSubjectId =
                    room.PreferredSubjectId,

                PreferredSubjectName =
                    room.PreferredSubject != null
                        ? room.PreferredSubject.Name
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