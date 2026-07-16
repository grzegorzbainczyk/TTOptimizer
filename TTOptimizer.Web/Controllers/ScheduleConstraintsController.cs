using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.Dto;

namespace TTOptimizer.Web.Controllers
{
    [ApiController]
    [Route("api/schedule-constraints")]
    public class ScheduleConstraintsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public ScheduleConstraintsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ScheduleConstraintDto>>> GetAll([FromQuery] int organizationId)
        {         
            var constraints = await _dbContext.ScheduleConstraints
                .Where(x => x.OrganizationId == organizationId)
                .OrderByDescending(x => x.IsActive)
                .ThenBy(x => x.ConstraintType)
                .ThenBy(x => x.Name)
                .Select(x => ToDto(x))
                .ToListAsync();

            return Ok(constraints);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ScheduleConstraintDto>> GetById(int id, [FromQuery] int organizationId)
        {
            var constraint = await _dbContext.ScheduleConstraints
                .Where(x => x.OrganizationId == organizationId)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (constraint == null)
            {
                return NotFound(new
                {
                    message = $"Schedule constraint with id {id} was not found."
                });
            }

            return Ok(ToDto(constraint));
        }

        [HttpPost]
        public async Task<ActionResult<ScheduleConstraintDto>> Create(
            CreateScheduleConstraintRequest request, [FromQuery] int organizationId)
        {
            string? validationError = ValidateRequest(
                request.Name,
                request.ConstraintType,
                request.TargetType,
                request.TargetId,
                request.Weight,
                request.DayOfWeek,
                request.SlotNumber);

            if (validationError != null)
            {
                return BadRequest(new
                {
                    message = validationError
                });
            }

            var constraint = new ScheduleConstraint
            {
                OrganizationId = organizationId,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                ConstraintType = request.ConstraintType.Trim(),
                TargetType = request.TargetType.Trim(),
                TargetId = request.TargetId,
                IsHard = request.IsHard,
                Weight = request.IsHard ? 100 : request.Weight,
                DayOfWeek = request.DayOfWeek,
                SlotNumber = request.SlotNumber,
                Value = request.Value?.Trim(),
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.ScheduleConstraints.Add(constraint);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = constraint.Id },
                ToDto(constraint));
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ScheduleConstraintDto>> Update(
            int id,
            UpdateScheduleConstraintRequest request,
            [FromQuery] int organizationId)
        {
            string? validationError = ValidateRequest(
                request.Name,
                request.ConstraintType,
                request.TargetType,
                request.TargetId,
                request.Weight,
                request.DayOfWeek,
                request.SlotNumber);

            if (validationError != null)
            {
                return BadRequest(new
                {
                    message = validationError
                });
            }

            var constraint = await _dbContext.ScheduleConstraints
                .Where(x => x.OrganizationId == organizationId)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (constraint == null)
            {
                return NotFound(new
                {
                    message = $"Schedule constraint with id {id} was not found."
                });
            }

            constraint.Name = request.Name.Trim();
            constraint.Description = request.Description?.Trim();
            constraint.ConstraintType = request.ConstraintType.Trim();
            constraint.TargetType = request.TargetType.Trim();
            constraint.TargetId = request.TargetId;
            constraint.IsHard = request.IsHard;
            constraint.Weight = request.IsHard ? 100 : request.Weight;
            constraint.DayOfWeek = request.DayOfWeek;
            constraint.SlotNumber = request.SlotNumber;
            constraint.Value = request.Value?.Trim();
            constraint.IsActive = request.IsActive;
            constraint.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return Ok(ToDto(constraint));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int organizationId)
        {
            var constraint = await _dbContext.ScheduleConstraints
                .Where(x => x.OrganizationId == organizationId)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (constraint == null)
            {
                return NotFound(new
                {
                    message = $"Schedule constraint with id {id} was not found."
                });
            }

            _dbContext.ScheduleConstraints.Remove(constraint);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        private static ScheduleConstraintDto ToDto(ScheduleConstraint constraint)
        {
            return new ScheduleConstraintDto
            {
                Id = constraint.Id,
                OrganizationId = constraint.OrganizationId,
                Name = constraint.Name,
                Description = constraint.Description,
                ConstraintType = constraint.ConstraintType,
                TargetType = constraint.TargetType,
                TargetId = constraint.TargetId,
                IsHard = constraint.IsHard,
                Weight = constraint.Weight,
                DayOfWeek = constraint.DayOfWeek,
                SlotNumber = constraint.SlotNumber,
                Value = constraint.Value,
                IsActive = constraint.IsActive,
                CreatedAt = constraint.CreatedAt,
                UpdatedAt = constraint.UpdatedAt
            };
        }

     private static string? ValidateRequest(
     string name,
     string constraintType,
     string targetType,
     int targetId,
     int weight,
     int? dayOfWeek,
     int? slotNumber)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return "Constraint name is required.";
            }

            if (string.IsNullOrWhiteSpace(constraintType))
            {
                return "Constraint type is required.";
            }

            if (string.IsNullOrWhiteSpace(targetType))
            {
                return "Target type is required.";
            }

            if (targetId <= 0)
            {
                return "Target id must be greater than zero.";
            }

            if (weight < 0 || weight > 100)
            {
                return "Weight must be between 0 and 100.";
            }

            if (dayOfWeek.HasValue && (dayOfWeek.Value < 1 || dayOfWeek.Value > 5))
            {
                return "Day of week must be between 1 and 5.";
            }

            if (slotNumber.HasValue && (slotNumber.Value < 1 || slotNumber.Value > 8))
            {
                return "Slot number must be between 1 and 8.";
            }

            return null;
        }
    }
}