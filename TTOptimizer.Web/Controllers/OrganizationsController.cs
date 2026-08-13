using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.DTO.Organizations;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public OrganizationsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrganizationDto>> GetById(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organization = await _dbContext.Organizations
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new OrganizationDto
            {
                Id = item.Id,
                Name = item.Name,
                Address = item.Address,
                DirectorName = item.DirectorName
            })
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        return Ok(organization);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<OrganizationDto>> Update(
        int id,
        [FromBody] UpdateOrganizationRequest request)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var name = request.Name?.Trim() ?? string.Empty;

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

        var address = NormalizeOptional(request.Address);
        var directorName = NormalizeOptional(request.DirectorName);

        if (address?.Length > 500)
        {
            return BadRequest(new
            {
                success = false,
                message = "Address cannot be longer than 500 characters."
            });
        }

        if (directorName?.Length > 200)
        {
            return BadRequest(new
            {
                success = false,
                message = "Director name cannot be longer than 200 characters."
            });
        }

        var organization = await _dbContext.Organizations
            .FirstOrDefaultAsync(item => item.Id == id);

        if (organization == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        organization.Name = name;
        organization.Address = address;
        organization.DirectorName = directorName;

        await _dbContext.SaveChangesAsync();

        return Ok(new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Address = organization.Address,
            DirectorName = organization.DirectorName
        });
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
