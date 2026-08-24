using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.ResourceTimeSlotPreferences;
using TTOptimizer.Web.Models.DTO.Rooms;
using TTOptimizer.Web.Models.DTO.Import;
using TTOptimizer.Web.Services;

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

                BuildingId = room.BuildingId,
                BuildingName = room.Building != null
                    ? room.Building.Name
                    : null,

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
            request.BuildingId,
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
            BuildingId = request.BuildingId,

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
            request.BuildingId,
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
        room.BuildingId = request.BuildingId;

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
                $"Could not read room import file: {error}");

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
    public async Task<IActionResult> ImportRooms(
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
                message = "There are no valid room names to import."
            });
        }

        var existingNames =
            await _db.Rooms
                .Where(room =>
                    room.OrganizationId == organizationId)
                .Select(room => room.Name)
                .ToListAsync();

        var existingNameSet = new HashSet<string>(
            existingNames,
            StringComparer.OrdinalIgnoreCase);

        var namesToImport = requestedNames
            .Where(name => !existingNameSet.Contains(name))
            .ToList();

        var skippedExistingCount =
            requestedNames.Count - namesToImport.Count;

        var roomsToAdd = namesToImport
            .Select(name => new Room
            {
                OrganizationId = organizationId,
                Name = name,
                Info = null,
                BuildingId = null,
                RestrictedToSubjectId = null,
                PreferredSubjectId = null
            })
            .ToList();

        if (roomsToAdd.Count > 0)
        {
            _db.Rooms.AddRange(roomsToAdd);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            success = true,
            importedCount = roomsToAdd.Count,
            skippedExistingCount
        });
    }


    [HttpPost("setup-import")]
    public async Task<IActionResult> SetupImportRooms(
        [FromQuery] int organizationId,
        [FromBody] SetupRoomImportRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        if (request.Rooms == null || request.Rooms.Count == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "At least one room is required."
            });
        }

        var organizationExists =
            await _db.Organizations.AnyAsync(item =>
                item.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var normalizedRooms = request.Rooms
            .Select(item => new
            {
                Name = item.Name?.Trim() ?? string.Empty,
                item.BuildingId
            })
            .ToList();

        if (normalizedRooms.Any(item =>
            string.IsNullOrWhiteSpace(item.Name) ||
            item.Name.Length > 100))
        {
            return BadRequest(new
            {
                success = false,
                message = "Every room must have a name between 1 and 100 characters."
            });
        }

        var duplicateInputName = normalizedRooms
            .GroupBy(
                item => item.Name,
                StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(group => group.Count() > 1);

        if (duplicateInputName != null)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    $"Room name '{duplicateInputName.Key}' appears more than once in the import."
            });
        }

        var buildingIds = normalizedRooms
            .Where(item => item.BuildingId.HasValue)
            .Select(item => item.BuildingId!.Value)
            .Distinct()
            .ToList();

        var validBuildingIds = await _db.Buildings
            .Where(item =>
                item.OrganizationId == organizationId &&
                buildingIds.Contains(item.Id))
            .Select(item => item.Id)
            .ToListAsync();

        var invalidBuildingId = buildingIds
            .FirstOrDefault(id => !validBuildingIds.Contains(id));

        if (invalidBuildingId != 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "One of the selected buildings does not exist."
            });
        }

        var existingRooms = await _db.Rooms
            .Where(item => item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name,
                item.BuildingId
            })
            .ToListAsync();

        var existingByName = existingRooms
            .ToDictionary(
                item => item.Name,
                StringComparer.OrdinalIgnoreCase);

        var roomsToAdd = new List<Room>();
        var skippedExisting = new List<string>();

        foreach (var item in normalizedRooms)
        {
            if (existingByName.ContainsKey(item.Name))
            {
                skippedExisting.Add(item.Name);
                continue;
            }

            roomsToAdd.Add(new Room
            {
                OrganizationId = organizationId,
                Name = item.Name,
                BuildingId = item.BuildingId,
                Info = null,
                RestrictedToSubjectId = null,
                PreferredSubjectId = null
            });
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            if (roomsToAdd.Count > 0)
            {
                _db.Rooms.AddRange(roomsToAdd);
                await _db.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                createdCount = roomsToAdd.Count,
                skippedExistingCount = skippedExisting.Count,
                skippedExisting
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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

        var room = await _db.Rooms
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

        if (room == null)
        {
            return NotFound(new
            {
                message = "Room not found."
            });
        }

        var timeSlotPreferences =
            await _db.RoomTimeSlotPreferences
                .AsNoTracking()
                .Where(item => item.RoomId == id)
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
            resourceType = "room",
            resourceId = room.Id,
            resourceName = room.Name,
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
            await _db.Rooms.AnyAsync(item =>
                item.Id == id &&
                item.OrganizationId == organizationId);

        if (!resourceExists)
        {
            return NotFound(new
            {
                message = "Room not found."
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
            await _db.RoomTimeSlotPreferences
                .Where(item => item.RoomId == id)
                .ToListAsync();

        _db.RoomTimeSlotPreferences.RemoveRange(existingPreferences);

        var newPreferences = normalizedPreferences
            .Select(slot => new RoomTimeSlotPreference
            {
                RoomId = id,
                DayIndex = slot.DayIndex,
                SlotIndex = slot.SlotIndex,
                PreferenceType = slot.PreferenceType
            })
            .ToList();

        _db.RoomTimeSlotPreferences.AddRange(newPreferences);

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            message = "Room time slot preferences were updated.",
            timeSlotPreferences = normalizedPreferences
                .OrderBy(slot => slot.DayIndex)
                .ThenBy(slot => slot.SlotIndex)
        });
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
        int? buildingId,
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

        if (buildingId.HasValue)
        {
            var buildingExists = await _db.Buildings
                .AnyAsync(building =>
                    building.Id == buildingId.Value &&
                    building.OrganizationId == organizationId
                );

            if (!buildingExists)
            {
                return BadRequest(new
                {
                    message = "The selected building does not exist."
                });
            }
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

                BuildingId = room.BuildingId,
                BuildingName = room.Building != null
                    ? room.Building.Name
                    : null,

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

public class SetupRoomImportRequest
{
    public List<SetupRoomImportItemRequest> Rooms { get; set; } = new();
}

public class SetupRoomImportItemRequest
{
    public string Name { get; set; } = string.Empty;

    public int? BuildingId { get; set; }
}
