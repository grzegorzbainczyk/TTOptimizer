using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.Buildings;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BuildingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BuildingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<BuildingDTO>>> GetBuildings(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new { message = "Organization ID is required." });
        }

        var buildings = await _db.Buildings
            .AsNoTracking()
            .Where(building => building.OrganizationId == organizationId)
            .OrderBy(building => building.Name)
            .Select(building => new BuildingDTO
            {
                Id = building.Id,
                Name = building.Name,
                Address = building.Address,
                Info = building.Info,
                RoomCount = building.Rooms.Count
            })
            .ToListAsync();

        return Ok(buildings);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BuildingDTO>> GetBuilding(
        int id,
        [FromQuery] int organizationId)
    {
        var building = await GetBuildingDtoAsync(id, organizationId);

        if (building == null)
        {
            return NotFound(new { message = "Building not found." });
        }

        return Ok(building);
    }

    [HttpPost]
    public async Task<ActionResult<BuildingDTO>> CreateBuilding(
        [FromQuery] int organizationId,
        [FromBody] CreateBuildingRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new { message = "Organization ID is required." });
        }

        var validationResult = ValidateRequest(request.Name, request.Address, request.Info);
        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();
        var nameExists = await _db.Buildings.AnyAsync(building =>
            building.OrganizationId == organizationId &&
            building.Name.ToLower() == normalizedName.ToLower());

        if (nameExists)
        {
            return Conflict(new { message = $"Building '{normalizedName}' already exists." });
        }

        var organizationExists = await _db.Organizations
            .AnyAsync(organization => organization.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new { message = "Organization was not found." });
        }

        var building = new Building
        {
            OrganizationId = organizationId,
            Name = normalizedName,
            Address = NormalizeOptionalText(request.Address),
            Info = NormalizeOptionalText(request.Info)
        };

        _db.Buildings.Add(building);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = $"Building '{normalizedName}' already exists." });
        }

        var result = await GetBuildingDtoAsync(building.Id, organizationId);

        return CreatedAtAction(
            nameof(GetBuilding),
            new { id = building.Id, organizationId },
            result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BuildingDTO>> UpdateBuilding(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateBuildingRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new { message = "Organization ID is required." });
        }

        var building = await _db.Buildings.FirstOrDefaultAsync(item =>
            item.Id == id && item.OrganizationId == organizationId);

        if (building == null)
        {
            return NotFound(new { message = "Building not found." });
        }

        var validationResult = ValidateRequest(request.Name, request.Address, request.Info);
        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();
        var nameExists = await _db.Buildings.AnyAsync(other =>
            other.OrganizationId == organizationId &&
            other.Id != id &&
            other.Name.ToLower() == normalizedName.ToLower());

        if (nameExists)
        {
            return Conflict(new { message = $"Building '{normalizedName}' already exists." });
        }

        building.Name = normalizedName;
        building.Address = NormalizeOptionalText(request.Address);
        building.Info = NormalizeOptionalText(request.Info);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = $"Building '{normalizedName}' already exists." });
        }

        return Ok(await GetBuildingDtoAsync(id, organizationId));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBuilding(
        int id,
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new { message = "Organization ID is required." });
        }

        var buildingExists = await _db.Buildings
            .AsNoTracking()
            .AnyAsync(item =>
                item.Id == id &&
                item.OrganizationId == organizationId);

        if (!buildingExists)
        {
            return NotFound(new { message = "Building not found." });
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            // Delete directly in the database instead of loading Room entities
            // into EF's change tracker. Database FK rules will then handle
            // dependent data such as ClassGroup.DefaultRoomId (SET NULL),
            // ScheduledLessons (CASCADE) and RoomTimeSlotPreferences (CASCADE).
            await _db.Rooms
                .Where(room =>
                    room.OrganizationId == organizationId &&
                    room.BuildingId == id)
                .ExecuteDeleteAsync();

            await _db.Buildings
                .Where(building =>
                    building.Id == id &&
                    building.OrganizationId == organizationId)
                .ExecuteDeleteAsync();

            await transaction.CommitAsync();

            return NoContent();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static ActionResult? ValidateRequest(
        string? name,
        string? address,
        string? info)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return new BadRequestObjectResult(new { message = "Building name is required." });
        }

        if (name.Trim().Length > 150)
        {
            return new BadRequestObjectResult(new { message = "Building name cannot contain more than 150 characters." });
        }

        if (address?.Trim().Length > 500)
        {
            return new BadRequestObjectResult(new { message = "Building address cannot contain more than 500 characters." });
        }

        if (info?.Trim().Length > 2000)
        {
            return new BadRequestObjectResult(new { message = "Building information cannot contain more than 2000 characters." });
        }

        return null;
    }

    private async Task<BuildingDTO?> GetBuildingDtoAsync(int id, int organizationId)
    {
        return await _db.Buildings
            .AsNoTracking()
            .Where(building =>
                building.Id == id &&
                building.OrganizationId == organizationId)
            .Select(building => new BuildingDTO
            {
                Id = building.Id,
                Name = building.Name,
                Address = building.Address,
                Info = building.Info,
                RoomCount = building.Rooms.Count
            })
            .FirstOrDefaultAsync();
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
