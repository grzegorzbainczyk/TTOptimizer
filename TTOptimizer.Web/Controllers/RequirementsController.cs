using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.DTO.Requirements;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequirementsController : ControllerBase
{
    private readonly AppDbContext _db;
    public RequirementsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<LessonRequirementDTO>>> GetRequirements([FromQuery] int organizationId)
    {
        if (organizationId <= 0)
            return BadRequest(new { message = "Organization ID is required." });

        await EnsureWholeClassGroupsAsync(organizationId);
        await BackfillLegacyStudentGroupsAsync(organizationId);

        var requirements = await _db.LessonRequirements
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .OrderBy(x => x.StudentGroup!.Name)
            .ThenBy(x => x.Subject.Name)
            .ThenBy(x => x.Teacher.Name)
            .Select(x => new LessonRequirementDTO
            {
                Id = x.Id,
                Name = x.Name,
                IsAdditional = x.IsAdditional,
                TeacherId = x.TeacherId,
                TeacherName = x.Teacher.Name,
                StudentGroupId = x.StudentGroupId!.Value,
                StudentGroupName = x.StudentGroup!.Name,
                ClassGroupId = x.StudentGroup.ClassGroupId,
                ClassName = x.StudentGroup.ClassGroup != null ? x.StudentGroup.ClassGroup.Name : null,
                SubjectId = x.SubjectId,
                SubjectName = x.Subject.Name,
                HoursPerWeek = x.HoursPerWeek,
                Priority = x.Priority
            })
            .ToListAsync();
        return Ok(requirements);
    }

    [HttpGet("curriculum-context")]
    public async Task<IActionResult> GetCurriculumContext(
        [FromQuery] int organizationId,
        [FromQuery] int classGroupId)
    {
        if (organizationId <= 0)
            return BadRequest(new { message = "Organization ID is required." });

        if (classGroupId <= 0)
            return BadRequest(new { message = "Class is required." });

        var classExists = await _db.ClassGroups
            .AsNoTracking()
            .AnyAsync(x =>
                x.Id == classGroupId &&
                x.OrganizationId == organizationId);

        if (!classExists)
            return NotFound(new { message = "Class was not found." });

        var teacherAssignments = await _db.TeacherAssignments
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                x.ClassGroupId == classGroupId)
            .OrderBy(x => x.Subject.Name)
            .ThenBy(x => x.Teacher.Name)
            .Select(x => new
            {
                x.Id,
                x.SubjectId,
                SubjectName = x.Subject.Name,
                x.TeacherId,
                TeacherName = x.Teacher.Name
            })
            .ToListAsync();

        return Ok(new
        {
            classGroupId,
            teacherAssignments
        });
    }


    [HttpGet("{id:int}")]
    public async Task<ActionResult<LessonRequirementDTO>> GetRequirement(int id, [FromQuery] int organizationId)
    {
        await EnsureWholeClassGroupsAsync(organizationId);
        await BackfillLegacyStudentGroupsAsync(organizationId);
        var dto = await GetRequirementDTOAsync(id, organizationId);
        return dto == null ? NotFound(new { message = "Lesson requirement not found." }) : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<LessonRequirementDTO>> CreateRequirement(
        [FromQuery] int organizationId,
        [FromBody] CreateStudentGroupLessonRequirementRequest request)
    {
        var validation = await ValidateRequestAsync(organizationId, request.TeacherId, request.StudentGroupId, request.SubjectId, request.HoursPerWeek, request.Priority);
        if (validation != null) return validation;

        var group = await _db.StudentGroups.FirstAsync(x => x.Id == request.StudentGroupId);
        var duplicate = await _db.LessonRequirements.AnyAsync(x =>
            x.OrganizationId == organizationId && x.TeacherId == request.TeacherId &&
            x.StudentGroupId == request.StudentGroupId && x.SubjectId == request.SubjectId);
        if (duplicate) return Conflict(new { message = "This lesson requirement already exists." });

        var entity = new LessonRequirement
        {
            OrganizationId = organizationId,
            Name = NormalizeName(request.Name),
            IsAdditional = request.IsAdditional,
            TeacherId = request.TeacherId,
            StudentGroupId = request.StudentGroupId,
            ClassGroupId = group.ClassGroupId,
            SubjectId = request.SubjectId,
            HoursPerWeek = request.HoursPerWeek,
            Priority = request.Priority
        };
        _db.LessonRequirements.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRequirement), new { id = entity.Id, organizationId },
            await GetRequirementDTOAsync(entity.Id, organizationId));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<LessonRequirementDTO>> UpdateRequirement(
        int id, [FromQuery] int organizationId,
        [FromBody] UpdateStudentGroupLessonRequirementRequest request)
    {
        var entity = await _db.LessonRequirements.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == organizationId);
        if (entity == null) return NotFound(new { message = "Lesson requirement not found." });

        var validation = await ValidateRequestAsync(organizationId, request.TeacherId, request.StudentGroupId, request.SubjectId, request.HoursPerWeek, request.Priority);
        if (validation != null) return validation;

        var duplicate = await _db.LessonRequirements.AnyAsync(x => x.OrganizationId == organizationId && x.Id != id &&
            x.TeacherId == request.TeacherId && x.StudentGroupId == request.StudentGroupId && x.SubjectId == request.SubjectId);
        if (duplicate) return Conflict(new { message = "This lesson requirement already exists." });

        var group = await _db.StudentGroups.FirstAsync(x => x.Id == request.StudentGroupId);
        entity.Name = NormalizeName(request.Name);
        entity.IsAdditional = request.IsAdditional;
        entity.TeacherId = request.TeacherId;
        entity.StudentGroupId = request.StudentGroupId;
        entity.ClassGroupId = group.ClassGroupId;
        entity.SubjectId = request.SubjectId;
        entity.HoursPerWeek = request.HoursPerWeek;
        entity.Priority = request.Priority;
        await _db.SaveChangesAsync();
        return Ok(await GetRequirementDTOAsync(id, organizationId));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRequirement(int id, [FromQuery] int organizationId)
    {
        var entity = await _db.LessonRequirements.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == organizationId);
        if (entity == null) return NotFound(new { message = "Lesson requirement not found." });
        _db.LessonRequirements.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult?> ValidateRequestAsync(int organizationId, int teacherId, int studentGroupId, int subjectId, int hoursPerWeek, LessonPriority priority)
    {
        if (organizationId <= 0) return BadRequest(new { message = "Organization ID is required." });
        if (teacherId <= 0) return BadRequest(new { message = "Teacher is required." });
        if (studentGroupId <= 0) return BadRequest(new { message = "Student group is required." });
        if (subjectId <= 0) return BadRequest(new { message = "Subject is required." });
        if (hoursPerWeek is < 1 or > 40) return BadRequest(new { message = "Hours per week must be between 1 and 40." });
        if (!Enum.IsDefined(priority)) return BadRequest(new { message = "Priority is invalid." });
        if (!await _db.Teachers.AnyAsync(x => x.Id == teacherId && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Teacher was not found." });
        if (!await _db.StudentGroups.AnyAsync(x => x.Id == studentGroupId && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Student group was not found." });
        if (!await _db.Subjects.AnyAsync(x => x.Id == subjectId && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Subject was not found." });
        return null;
    }

    private Task<LessonRequirementDTO?> GetRequirementDTOAsync(int id, int organizationId) =>
        _db.LessonRequirements.AsNoTracking()
            .Where(x => x.Id == id && x.OrganizationId == organizationId)
            .Select(x => new LessonRequirementDTO
            {
                Id = x.Id, Name = x.Name, IsAdditional = x.IsAdditional, TeacherId = x.TeacherId, TeacherName = x.Teacher.Name,
                StudentGroupId = x.StudentGroupId!.Value, StudentGroupName = x.StudentGroup!.Name,
                ClassGroupId = x.StudentGroup.ClassGroupId,
                ClassName = x.StudentGroup.ClassGroup != null ? x.StudentGroup.ClassGroup.Name : null,
                SubjectId = x.SubjectId, SubjectName = x.Subject.Name, HoursPerWeek = x.HoursPerWeek, Priority = x.Priority
            }).FirstOrDefaultAsync();

    private static string? NormalizeName(string? name)
    {
        var normalized = name?.Trim();
        return string.IsNullOrWhiteSpace(normalized)
            ? null
            : normalized;
    }

    private async Task EnsureWholeClassGroupsAsync(int organizationId)
    {
        var classes = await _db.ClassGroups.Where(x => x.OrganizationId == organizationId).ToListAsync();
        var existing = (await _db.StudentGroups.Where(x => x.OrganizationId == organizationId && x.Type == StudentGroupType.WholeClass && x.ClassGroupId.HasValue)
            .Select(x => x.ClassGroupId!.Value).ToListAsync()).ToHashSet();
        foreach (var c in classes.Where(x => !existing.Contains(x.Id)))
            _db.StudentGroups.Add(new StudentGroup { OrganizationId = organizationId, ClassGroupId = c.Id, Name = c.Name, Type = StudentGroupType.WholeClass });
        await _db.SaveChangesAsync();
    }

    private async Task BackfillLegacyStudentGroupsAsync(int organizationId)
    {
        var legacy = await _db.LessonRequirements.Where(x => x.OrganizationId == organizationId && x.StudentGroupId == null && x.ClassGroupId != null).ToListAsync();
        if (legacy.Count == 0) return;
        var whole = await _db.StudentGroups.Where(x => x.OrganizationId == organizationId && x.Type == StudentGroupType.WholeClass && x.ClassGroupId != null)
            .ToDictionaryAsync(x => x.ClassGroupId!.Value, x => x.Id);
        foreach (var requirement in legacy)
            if (requirement.ClassGroupId.HasValue && whole.TryGetValue(requirement.ClassGroupId.Value, out var groupId))
                requirement.StudentGroupId = groupId;
        await _db.SaveChangesAsync();
    }
}
