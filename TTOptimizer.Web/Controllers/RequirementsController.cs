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
                Priority = x.Priority,
                PreferredRoomId = x.PreferredRoomId,
                PreferredRoomName = x.PreferredRoom != null ? x.PreferredRoom.Name : null,
                PreferredRoomImportance = x.PreferredRoomImportance
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


    [HttpPost("import-teaching-plan")]
    public async Task<IActionResult> ImportTeachingPlan(
        [FromQuery] int organizationId,
        [FromBody] ImportTeachingPlanRequest request)
    {
        if (organizationId <= 0)
            return BadRequest(new { message = "Organization ID is required." });

        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(new { message = "At least one teaching-plan item is required." });

        var organizationExists = await _db.Organizations
            .AsNoTracking()
            .AnyAsync(x => x.Id == organizationId);

        if (!organizationExists)
            return NotFound(new { message = "Organization was not found." });

        await EnsureWholeClassGroupsAsync(organizationId);

        var classIds = request.Items
            .Select(x => x.ClassGroupId)
            .Distinct()
            .ToList();

        var teacherIds = request.Items
            .Select(x => x.TeacherId)
            .Distinct()
            .ToList();

        var classes = await _db.ClassGroups
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                classIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        if (classes.Count != classIds.Count)
            return BadRequest(new { message = "One or more classes were not found." });

        var teachers = await _db.Teachers
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                teacherIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        if (teachers.Count != teacherIds.Count)
            return BadRequest(new { message = "One or more teachers were not found." });

        var wholeClassGroups = await _db.StudentGroups
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId &&
                x.Type == StudentGroupType.WholeClass &&
                x.ClassGroupId.HasValue &&
                classIds.Contains(x.ClassGroupId.Value))
            .ToDictionaryAsync(
                x => x.ClassGroupId!.Value,
                x => x.Id);

        if (wholeClassGroups.Count != classIds.Count)
            return BadRequest(new { message = "A whole-class student group is missing for one or more classes." });

        var requestedSubjectIds = request.Items
            .Where(x => x.SubjectId.HasValue && x.SubjectId.Value > 0)
            .Select(x => x.SubjectId!.Value)
            .Distinct()
            .ToList();

        var existingSubjects = await _db.Subjects
            .Where(x =>
                x.OrganizationId == organizationId &&
                requestedSubjectIds.Contains(x.Id))
            .ToListAsync();

        if (existingSubjects.Count != requestedSubjectIds.Count)
            return BadRequest(new { message = "One or more subjects were not found." });

        var allOrganizationSubjects = await _db.Subjects
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync();

        var subjectsByName = allOrganizationSubjects.ToDictionary(
            x => NormalizeTeachingPlanSubjectName(x.Name),
            StringComparer.OrdinalIgnoreCase);

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            var createdSubjects = 0;

            foreach (var item in request.Items.Where(
                x => !x.SubjectId.HasValue || x.SubjectId.Value <= 0))
            {
                var subjectName = item.SubjectName?.Trim();

                if (string.IsNullOrWhiteSpace(subjectName))
                    return BadRequest(new { message = "Subject name is required for a new subject." });

                if (subjectName.Length > 100)
                    return BadRequest(new { message = $"Subject name '{subjectName}' is too long." });

                var key = NormalizeTeachingPlanSubjectName(subjectName);

                if (!subjectsByName.TryGetValue(key, out var subject))
                {
                    subject = new Subject
                    {
                        OrganizationId = organizationId,
                        Name = subjectName,
                        Info = null
                    };

                    _db.Subjects.Add(subject);
                    await _db.SaveChangesAsync();

                    subjectsByName[key] = subject;
                    createdSubjects++;
                }

                item.ResolvedSubjectId = subject.Id;
            }

            foreach (var item in request.Items.Where(
                x => x.SubjectId.HasValue && x.SubjectId.Value > 0))
            {
                item.ResolvedSubjectId = item.SubjectId!.Value;
            }

            var studentGroupIds = wholeClassGroups.Values.ToList();

            var existingRequirements = await _db.LessonRequirements
                .Where(x =>
                    x.OrganizationId == organizationId &&
                    x.StudentGroupId.HasValue &&
                    studentGroupIds.Contains(x.StudentGroupId.Value) &&
                    !x.IsAdditional)
                .ToListAsync();

            var existingByKey = existingRequirements
                .GroupBy(x => (x.StudentGroupId!.Value, x.SubjectId))
                .ToDictionary(group => group.Key, group => group.First());

            var createdRequirements = 0;
            var updatedRequirements = 0;
            var unchangedRequirements = 0;
            var skippedDuplicateRequestItems = 0;

            var requestKeys =
                new HashSet<(int StudentGroupId, int SubjectId)>();

            foreach (var item in request.Items)
            {
                if (item.HoursPerWeek is < 1 or > 40)
                    return BadRequest(new { message = "Hours per week must be between 1 and 40." });

                var studentGroupId =
                    wholeClassGroups[item.ClassGroupId];

                var subjectId =
                    item.ResolvedSubjectId;

                var key =
                    (StudentGroupId: studentGroupId, SubjectId: subjectId);

                if (!requestKeys.Add(key))
                {
                    skippedDuplicateRequestItems++;
                    continue;
                }

                if (existingByKey.TryGetValue(key, out var existing))
                {
                    var changed =
                        existing.TeacherId != item.TeacherId ||
                        existing.HoursPerWeek != item.HoursPerWeek ||
                        existing.ClassGroupId != item.ClassGroupId;

                    if (!changed)
                    {
                        unchangedRequirements++;
                        continue;
                    }

                    existing.TeacherId = item.TeacherId;
                    existing.HoursPerWeek = item.HoursPerWeek;
                    existing.ClassGroupId = item.ClassGroupId;
                    updatedRequirements++;
                    continue;
                }

                var requirement = new LessonRequirement
                {
                    OrganizationId = organizationId,
                    Name = null,
                    IsAdditional = false,
                    TeacherId = item.TeacherId,
                    StudentGroupId = studentGroupId,
                    ClassGroupId = item.ClassGroupId,
                    SubjectId = subjectId,
                    HoursPerWeek = item.HoursPerWeek,
                    Priority = LessonPriority.Normal
                };

                _db.LessonRequirements.Add(requirement);
                existingByKey[key] = requirement;
                createdRequirements++;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                createdSubjects,
                createdRequirements,
                updatedRequirements,
                unchangedRequirements,
                skippedDuplicateRequestItems
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static string NormalizeTeachingPlanSubjectName(string value) =>
        value.Trim().ToUpperInvariant();


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
        var validation = await ValidateRequestAsync(organizationId, request.TeacherId, request.StudentGroupId, request.SubjectId, request.HoursPerWeek, request.Priority, request.PreferredRoomId, request.PreferredRoomImportance);
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
            Priority = request.Priority,
            PreferredRoomId = request.PreferredRoomId,
            PreferredRoomImportance = request.PreferredRoomId.HasValue
                ? request.PreferredRoomImportance
                : SchedulingPreferenceLevel.Disabled
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

        var validation = await ValidateRequestAsync(organizationId, request.TeacherId, request.StudentGroupId, request.SubjectId, request.HoursPerWeek, request.Priority, request.PreferredRoomId, request.PreferredRoomImportance);
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
        entity.PreferredRoomId = request.PreferredRoomId;
        entity.PreferredRoomImportance = request.PreferredRoomId.HasValue
            ? request.PreferredRoomImportance
            : SchedulingPreferenceLevel.Disabled;
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

    private async Task<ActionResult?> ValidateRequestAsync(int organizationId, int teacherId, int studentGroupId, int subjectId, int hoursPerWeek, LessonPriority priority, int? preferredRoomId, SchedulingPreferenceLevel preferredRoomImportance)
    {
        if (organizationId <= 0) return BadRequest(new { message = "Organization ID is required." });
        if (teacherId <= 0) return BadRequest(new { message = "Teacher is required." });
        if (studentGroupId <= 0) return BadRequest(new { message = "Student group is required." });
        if (subjectId <= 0) return BadRequest(new { message = "Subject is required." });
        if (hoursPerWeek is < 1 or > 40) return BadRequest(new { message = "Hours per week must be between 1 and 40." });
        if (!Enum.IsDefined(priority)) return BadRequest(new { message = "Priority is invalid." });
        if (!Enum.IsDefined(preferredRoomImportance)) return BadRequest(new { message = "Preferred room importance is invalid." });
        if (preferredRoomId.HasValue && preferredRoomImportance == SchedulingPreferenceLevel.Disabled)
            return BadRequest(new { message = "Select an importance level for the preferred room." });
        if (!await _db.Teachers.AnyAsync(x => x.Id == teacherId && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Teacher was not found." });
        if (!await _db.StudentGroups.AnyAsync(x => x.Id == studentGroupId && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Student group was not found." });
        if (!await _db.Subjects.AnyAsync(x => x.Id == subjectId && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Subject was not found." });
        if (preferredRoomId.HasValue && !await _db.Rooms.AnyAsync(x => x.Id == preferredRoomId.Value && x.OrganizationId == organizationId))
            return BadRequest(new { message = "Preferred room was not found." });
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
                SubjectId = x.SubjectId, SubjectName = x.Subject.Name, HoursPerWeek = x.HoursPerWeek, Priority = x.Priority,
                PreferredRoomId = x.PreferredRoomId,
                PreferredRoomName = x.PreferredRoom != null ? x.PreferredRoom.Name : null,
                PreferredRoomImportance = x.PreferredRoomImportance
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

public class ImportTeachingPlanRequest
{
    public List<ImportTeachingPlanItemRequest> Items { get; set; } = new();
}

public class ImportTeachingPlanItemRequest
{
    public int ClassGroupId { get; set; }

    public int TeacherId { get; set; }

    public int? SubjectId { get; set; }

    public string? SubjectName { get; set; }

    public int HoursPerWeek { get; set; }

    public int ResolvedSubjectId { get; set; }
}
