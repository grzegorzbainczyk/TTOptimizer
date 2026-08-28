using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.SchoolUnits;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchoolUnitsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SchoolUnitsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<SchoolUnitDto>>> GetAll(
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

        var organizationExists =
            await _dbContext.Organizations
                .AsNoTracking()
                .AnyAsync(item => item.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var schoolUnits =
            await _dbContext.SchoolUnits
                .AsNoTracking()
                .Where(item => item.OrganizationId == organizationId)
                .OrderBy(item => item.Name)
                .Select(item => new SchoolUnitDto
                {
                    Id = item.Id,
                    OrganizationId = item.OrganizationId,
                    Name = item.Name,
                    SchoolType = item.SchoolType
                })
                .ToListAsync();

        return Ok(schoolUnits);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SchoolUnitDto>> GetById(
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

        var schoolUnit =
            await _dbContext.SchoolUnits
                .AsNoTracking()
                .Where(item =>
                    item.Id == id &&
                    item.OrganizationId == organizationId)
                .Select(item => new SchoolUnitDto
                {
                    Id = item.Id,
                    OrganizationId = item.OrganizationId,
                    Name = item.Name,
                    SchoolType = item.SchoolType
                })
                .FirstOrDefaultAsync();

        if (schoolUnit == null)
        {
            return NotFound(new
            {
                success = false,
                message = "School was not found."
            });
        }

        return Ok(schoolUnit);
    }

    [HttpPost]
    public async Task<ActionResult<SchoolUnitDto>> Create(
        [FromQuery] int organizationId,
        [FromBody] CreateSchoolUnitRequest request)
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
            await _dbContext.Organizations
                .AnyAsync(item => item.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var validationResult =
            ValidateSchoolUnitRequest(request.Name, request.SchoolType);

        if (validationResult != null)
        {
            return validationResult;
        }

        var name = request.Name.Trim();

        var duplicateExists =
            await _dbContext.SchoolUnits
                .AnyAsync(item =>
                    item.OrganizationId == organizationId &&
                    item.Name == name);

        if (duplicateExists)
        {
            return Conflict(new
            {
                success = false,
                message = $"School '{name}' already exists."
            });
        }

        var schoolUnit = new SchoolUnit
        {
            OrganizationId = organizationId,
            Name = name,
            SchoolType = request.SchoolType
        };

        _dbContext.SchoolUnits.Add(schoolUnit);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = schoolUnit.Id,
                organizationId
            },
            ToDto(schoolUnit));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SchoolUnitDto>> Update(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateSchoolUnitRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var validationResult =
            ValidateSchoolUnitRequest(request.Name, request.SchoolType);

        if (validationResult != null)
        {
            return validationResult;
        }

        var schoolUnit =
            await _dbContext.SchoolUnits
                .FirstOrDefaultAsync(item =>
                    item.Id == id &&
                    item.OrganizationId == organizationId);

        if (schoolUnit == null)
        {
            return NotFound(new
            {
                success = false,
                message = "School was not found."
            });
        }

        var name = request.Name.Trim();

        var duplicateExists =
            await _dbContext.SchoolUnits
                .AnyAsync(item =>
                    item.OrganizationId == organizationId &&
                    item.Id != id &&
                    item.Name == name);

        if (duplicateExists)
        {
            return Conflict(new
            {
                success = false,
                message = $"School '{name}' already exists."
            });
        }

        schoolUnit.Name = name;
        schoolUnit.SchoolType = request.SchoolType;

        await _dbContext.SaveChangesAsync();

        return Ok(ToDto(schoolUnit));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        [FromQuery] int organizationId,
        [FromQuery] bool deleteClasses = false)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var schoolUnit =
            await _dbContext.SchoolUnits
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.Id == id &&
                    item.OrganizationId == organizationId);

        if (schoolUnit == null)
        {
            return NotFound(new
            {
                success = false,
                message = "School was not found."
            });
        }

        var classIds =
            await _dbContext.ClassGroups
                .AsNoTracking()
                .Where(item =>
                    item.OrganizationId == organizationId &&
                    item.SchoolUnitId == id)
                .Select(item => item.Id)
                .ToListAsync();

        if (classIds.Count > 0 && !deleteClasses)
        {
            return Conflict(new
            {
                success = false,
                code = "school_has_classes",
                classCount = classIds.Count,
                message =
                    "Ta szkoła ma przypisane klasy. Jej usunięcie może również usunąć dane powiązane z tymi klasami."
            });
        }

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync();

        try
        {
            if (classIds.Count > 0)
            {
                var studentGroupIds =
                    await _dbContext.StudentGroups
                        .AsNoTracking()
                        .Where(item =>
                            item.OrganizationId == organizationId &&
                            item.ClassGroupId.HasValue &&
                            classIds.Contains(item.ClassGroupId.Value))
                        .Select(item => item.Id)
                        .ToListAsync();

                await _dbContext.LessonRequirements
                    .Where(item =>
                        item.OrganizationId == organizationId &&
                        (
                            (item.ClassGroupId.HasValue &&
                             classIds.Contains(item.ClassGroupId.Value)) ||
                            (item.StudentGroupId.HasValue &&
                             studentGroupIds.Contains(item.StudentGroupId.Value))
                        ))
                    .ExecuteDeleteAsync();

                if (studentGroupIds.Count > 0)
                {
                    await _dbContext.StudentGroupMembers
                        .Where(item =>
                            studentGroupIds.Contains(item.StudentGroupId) ||
                            studentGroupIds.Contains(item.MemberGroupId))
                        .ExecuteDeleteAsync();
                }

                await _dbContext.ClassGroups
                    .Where(item =>
                        item.OrganizationId == organizationId &&
                        classIds.Contains(item.Id))
                    .ExecuteDeleteAsync();
            }

            await _dbContext.SchoolUnits
                .Where(item =>
                    item.Id == id &&
                    item.OrganizationId == organizationId)
                .ExecuteDeleteAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                deletedClasses = classIds.Count,
                message =
                    classIds.Count > 0
                        ? $"Szkoła została usunięta razem z {classIds.Count} klasami."
                        : "Szkoła została usunięta."
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private ActionResult? ValidateSchoolUnitRequest(
        string? requestedName,
        SchoolType schoolType)
    {
        var name = requestedName?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                success = false,
                message = "School name is required."
            });
        }

        if (name.Length > 200)
        {
            return BadRequest(new
            {
                success = false,
                message = "School name cannot be longer than 200 characters."
            });
        }

        if (schoolType == SchoolType.Unknown ||
            !Enum.IsDefined(schoolType))
        {
            return BadRequest(new
            {
                success = false,
                message = "A valid school type is required."
            });
        }

        return null;
    }

    private static SchoolUnitDto ToDto(SchoolUnit schoolUnit)
    {
        return new SchoolUnitDto
        {
            Id = schoolUnit.Id,
            OrganizationId = schoolUnit.OrganizationId,
            Name = schoolUnit.Name,
            SchoolType = schoolUnit.SchoolType
        };
    }
}
