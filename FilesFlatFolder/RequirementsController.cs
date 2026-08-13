using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.DTO.Requirements;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequirementsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RequirementsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<LessonRequirementDTO>>>
        GetRequirements(
            [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var requirements = await _db.LessonRequirements
            .AsNoTracking()
            .Where(requirement =>
                requirement.OrganizationId == organizationId)
            .OrderBy(requirement =>
                requirement.ClassGroup.Name)
            .ThenBy(requirement =>
                requirement.Subject.Name)
            .ThenBy(requirement =>
                requirement.Teacher.Name)
            .Select(requirement =>
                new LessonRequirementDTO
                {
                    Id = requirement.Id,

                    TeacherId =
                        requirement.TeacherId,

                    TeacherName =
                        requirement.Teacher.Name,

                    ClassGroupId =
                        requirement.ClassGroupId,

                    ClassName =
                        requirement.ClassGroup.Name,

                    SubjectId =
                        requirement.SubjectId,

                    SubjectName =
                        requirement.Subject.Name,

                    HoursPerWeek =
                        requirement.HoursPerWeek
                })
            .ToListAsync();

        return Ok(requirements);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LessonRequirementDTO>>
        GetRequirement(
            int id,
            [FromQuery] int organizationId)
    {
        var requirement = await GetRequirementDTOAsync(
            id,
            organizationId
        );

        if (requirement == null)
        {
            return NotFound(new
            {
                message = "Lesson requirement not found."
            });
        }

        return Ok(requirement);
    }

    [HttpPost]
    public async Task<ActionResult<LessonRequirementDTO>>
        CreateRequirement(
            [FromQuery] int organizationId,
            [FromBody]
            CreateLessonRequirementRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var validationResult =
            await ValidateRequestAsync(
                organizationId,
                request.TeacherId,
                request.ClassGroupId,
                request.SubjectId,
                request.HoursPerWeek
            );

        if (validationResult != null)
        {
            return validationResult;
        }

        var duplicateExists =
            await _db.LessonRequirements
                .AnyAsync(requirement =>
                    requirement.OrganizationId ==
                        organizationId &&
                    requirement.TeacherId ==
                        request.TeacherId &&
                    requirement.ClassGroupId ==
                        request.ClassGroupId &&
                    requirement.SubjectId ==
                        request.SubjectId
                );

        if (duplicateExists)
        {
            return Conflict(new
            {
                message =
                    "This lesson requirement already exists."
            });
        }

        var requirement = new LessonRequirement
        {
            OrganizationId = organizationId,
            TeacherId = request.TeacherId,
            ClassGroupId = request.ClassGroupId,
            SubjectId = request.SubjectId,
            HoursPerWeek = request.HoursPerWeek
        };

        _db.LessonRequirements.Add(requirement);
        await _db.SaveChangesAsync();

        var result = await GetRequirementDTOAsync(
            requirement.Id,
            organizationId
        );

        return CreatedAtAction(
            nameof(GetRequirement),
            new
            {
                id = requirement.Id,
                organizationId
            },
            result
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<LessonRequirementDTO>>
        UpdateRequirement(
            int id,
            [FromQuery] int organizationId,
            [FromBody]
            UpdateLessonRequirementRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var requirement =
            await _db.LessonRequirements
                .FirstOrDefaultAsync(requirement =>
                    requirement.Id == id &&
                    requirement.OrganizationId ==
                        organizationId
                );

        if (requirement == null)
        {
            return NotFound(new
            {
                message = "Lesson requirement not found."
            });
        }

        var validationResult =
            await ValidateRequestAsync(
                organizationId,
                request.TeacherId,
                request.ClassGroupId,
                request.SubjectId,
                request.HoursPerWeek
            );

        if (validationResult != null)
        {
            return validationResult;
        }

        var duplicateExists =
            await _db.LessonRequirements
                .AnyAsync(otherRequirement =>
                    otherRequirement.OrganizationId ==
                        organizationId &&
                    otherRequirement.Id != id &&
                    otherRequirement.TeacherId ==
                        request.TeacherId &&
                    otherRequirement.ClassGroupId ==
                        request.ClassGroupId &&
                    otherRequirement.SubjectId ==
                        request.SubjectId
                );

        if (duplicateExists)
        {
            return Conflict(new
            {
                message =
                    "This lesson requirement already exists."
            });
        }

        requirement.TeacherId =
            request.TeacherId;

        requirement.ClassGroupId =
            request.ClassGroupId;

        requirement.SubjectId =
            request.SubjectId;

        requirement.HoursPerWeek =
            request.HoursPerWeek;

        await _db.SaveChangesAsync();

        var result = await GetRequirementDTOAsync(
            requirement.Id,
            organizationId
        );

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRequirement(
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

        var requirement =
            await _db.LessonRequirements
                .FirstOrDefaultAsync(requirement =>
                    requirement.Id == id &&
                    requirement.OrganizationId ==
                        organizationId
                );

        if (requirement == null)
        {
            return NotFound(new
            {
                message = "Lesson requirement not found."
            });
        }

        _db.LessonRequirements.Remove(requirement);

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?>
        ValidateRequestAsync(
            int organizationId,
            int teacherId,
            int classGroupId,
            int subjectId,
            int hoursPerWeek)
    {
        if (teacherId <= 0)
        {
            return BadRequest(new
            {
                message = "Teacher is required."
            });
        }

        if (classGroupId <= 0)
        {
            return BadRequest(new
            {
                message = "Class is required."
            });
        }

        if (subjectId <= 0)
        {
            return BadRequest(new
            {
                message = "Subject is required."
            });
        }

        if (hoursPerWeek <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Hours per week must be greater than zero."
            });
        }

        if (hoursPerWeek > 40)
        {
            return BadRequest(new
            {
                message =
                    "Hours per week cannot be greater than 40."
            });
        }

        var teacherExists =
            await _db.Teachers.AnyAsync(teacher =>
                teacher.Id == teacherId &&
                teacher.OrganizationId == organizationId
            );

        if (!teacherExists)
        {
            return BadRequest(new
            {
                message =
                    "The selected teacher does not exist."
            });
        }

        var classExists =
            await _db.ClassGroups.AnyAsync(classGroup =>
                classGroup.Id == classGroupId &&
                classGroup.OrganizationId ==
                    organizationId
            );

        if (!classExists)
        {
            return BadRequest(new
            {
                message =
                    "The selected class does not exist."
            });
        }

        var subjectExists =
            await _db.Subjects.AnyAsync(subject =>
                subject.Id == subjectId &&
                subject.OrganizationId ==
                    organizationId
            );

        if (!subjectExists)
        {
            return BadRequest(new
            {
                message =
                    "The selected subject does not exist."
            });
        }

        return null;
    }

    private async Task<LessonRequirementDTO?>
        GetRequirementDTOAsync(
            int id,
            int organizationId)
    {
        return await _db.LessonRequirements
            .AsNoTracking()
            .Where(requirement =>
                requirement.Id == id &&
                requirement.OrganizationId ==
                    organizationId)
            .Select(requirement =>
                new LessonRequirementDTO
                {
                    Id = requirement.Id,

                    TeacherId =
                        requirement.TeacherId,

                    TeacherName =
                        requirement.Teacher.Name,

                    ClassGroupId =
                        requirement.ClassGroupId,

                    ClassName =
                        requirement.ClassGroup.Name,

                    SubjectId =
                        requirement.SubjectId,

                    SubjectName =
                        requirement.Subject.Name,

                    HoursPerWeek =
                        requirement.HoursPerWeek
                })
            .FirstOrDefaultAsync();
    }
}