using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.StudentGroups;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/student-groups")]
public class StudentGroupsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StudentGroupsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<StudentGroupsOverviewDto>> GetAll(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
            return BadRequest(new { message = "Organization ID is required." });

        await EnsureWholeClassGroupsAsync(organizationId);

        var groups = await _db.StudentGroups
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .Include(x => x.ClassGroup)
            .Include(x => x.Division)
            .Include(x => x.Members)
                .ThenInclude(x => x.MemberGroup)
            .OrderBy(x => x.ClassGroup != null ? x.ClassGroup.Name : "~")
            .ThenBy(x => x.Division != null ? x.Division.Name : "")
            .ThenBy(x => x.Name)
            .ToListAsync();

        var divisions = await _db.StudentGroupDivisions
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .Include(x => x.ClassGroup)
            .OrderBy(x => x.ClassGroup.Name)
            .ThenBy(x => x.Name)
            .ToListAsync();

        var groupDtos = groups.Select(ToDto).ToList();
        var byDivision = groupDtos
            .Where(x => x.DivisionId.HasValue)
            .GroupBy(x => x.DivisionId!.Value)
            .ToDictionary(x => x.Key, x => x.ToList());

        return Ok(new StudentGroupsOverviewDto
        {
            Groups = groupDtos,
            Divisions = divisions.Select(x => new StudentGroupDivisionDto
            {
                Id = x.Id,
                ClassGroupId = x.ClassGroupId,
                ClassGroupName = x.ClassGroup.Name,
                Name = x.Name,
                Groups = byDivision.GetValueOrDefault(x.Id) ?? new()
            }).ToList()
        });
    }

    [HttpPost("divisions")]
    public async Task<IActionResult> CreateDivision(
        [FromQuery] int organizationId,
        [FromBody] CreateStudentGroupDivisionRequest request)
    {
        if (organizationId <= 0)
            return BadRequest(new { message = "Organization ID is required." });

        var classGroup = await _db.ClassGroups.FirstOrDefaultAsync(x =>
            x.Id == request.ClassGroupId && x.OrganizationId == organizationId);
        if (classGroup == null)
            return BadRequest(new { message = "Class was not found." });

        var name = request.Name?.Trim() ?? "";
        var names = request.GroupNames
            .Select(x => x?.Trim() ?? "")
            .Where(x => x.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (name.Length == 0)
            return BadRequest(new { message = "Division name is required." });
        if (names.Count < 2)
            return BadRequest(new { message = "A division must contain at least two groups." });

        if (await _db.StudentGroupDivisions.AnyAsync(x =>
            x.ClassGroupId == classGroup.Id && x.Name.ToLower() == name.ToLower()))
            return Conflict(new { message = $"Division '{name}' already exists for class {classGroup.Name}." });

        foreach (var groupName in names)
        {
            if (await _db.StudentGroups.AnyAsync(x =>
                x.OrganizationId == organizationId && x.Name.ToLower() == groupName.ToLower()))
                return Conflict(new { message = $"Student group '{groupName}' already exists." });
        }

        var division = new StudentGroupDivision
        {
            OrganizationId = organizationId,
            ClassGroupId = classGroup.Id,
            Name = name
        };

        foreach (var groupName in names)
        {
            division.StudentGroups.Add(new StudentGroup
            {
                OrganizationId = organizationId,
                ClassGroupId = classGroup.Id,
                Name = groupName,
                Type = StudentGroupType.Subgroup
            });
        }

        _db.StudentGroupDivisions.Add(division);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, divisionId = division.Id });
    }

    [HttpPost("individual")]
    public async Task<IActionResult> CreateIndividual(
        [FromQuery] int organizationId,
        [FromBody] CreateIndividualStudentGroupRequest request)
    {
        var classGroup = await _db.ClassGroups.FirstOrDefaultAsync(x =>
            x.Id == request.ClassGroupId && x.OrganizationId == organizationId);
        if (classGroup == null)
            return BadRequest(new { message = "Class was not found." });

        var name = request.Name?.Trim() ?? "";
        if (name.Length == 0)
            return BadRequest(new { message = "Individual group name is required." });

        if (await _db.StudentGroups.AnyAsync(x =>
            x.OrganizationId == organizationId && x.Name.ToLower() == name.ToLower()))
            return Conflict(new { message = $"Student group '{name}' already exists." });

        var group = new StudentGroup
        {
            OrganizationId = organizationId,
            ClassGroupId = classGroup.Id,
            Name = name,
            Type = StudentGroupType.Individual
        };
        _db.StudentGroups.Add(group);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, groupId = group.Id });
    }

    [HttpPost("combined")]
    public async Task<IActionResult> CreateCombined(
        [FromQuery] int organizationId,
        [FromBody] CreateCombinedStudentGroupRequest request)
    {
        var name = request.Name?.Trim() ?? "";
        var memberIds = request.MemberGroupIds.Distinct().ToList();

        if (name.Length == 0)
            return BadRequest(new { message = "Combined group name is required." });
        if (memberIds.Count < 2)
            return BadRequest(new { message = "A combined group must contain at least two member groups." });

        if (await _db.StudentGroups.AnyAsync(x =>
            x.OrganizationId == organizationId && x.Name.ToLower() == name.ToLower()))
            return Conflict(new { message = $"Student group '{name}' already exists." });

        var members = await _db.StudentGroups
            .Where(x => x.OrganizationId == organizationId && memberIds.Contains(x.Id))
            .ToListAsync();

        if (members.Count != memberIds.Count)
            return BadRequest(new { message = "One or more member groups were not found." });
        if (members.Any(x => x.Type == StudentGroupType.Combined))
            return BadRequest(new { message = "Nested combined groups are not supported yet." });

        var group = new StudentGroup
        {
            OrganizationId = organizationId,
            Name = name,
            Type = StudentGroupType.Combined
        };

        foreach (var member in members)
            group.Members.Add(new StudentGroupMember { MemberGroupId = member.Id });

        _db.StudentGroups.Add(group);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, groupId = group.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteGroup(int id, [FromQuery] int organizationId)
    {
        var group = await _db.StudentGroups
            .Include(x => x.Members)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == organizationId);
        if (group == null)
            return NotFound(new { message = "Student group was not found." });
        if (group.Type == StudentGroupType.WholeClass)
            return BadRequest(new
            {
                code = "whole_class_managed",
                message = "The whole-class group is managed automatically with its class."
            });

        if (await _db.LessonRequirements.AnyAsync(x => x.StudentGroupId == id))
            return Conflict(new
            {
                code = "group_used_by_lessons",
                message = "Student group is used by lesson requirements."
            });

        if (await _db.StudentGroupMembers.AnyAsync(x => x.MemberGroupId == id))
            return Conflict(new
            {
                code = "group_used_by_combined",
                message = "Student group is used by a combined group."
            });

        _db.StudentGroups.Remove(group);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("divisions/{id:int}")]
    public async Task<IActionResult> DeleteDivision(int id, [FromQuery] int organizationId)
    {
        var division = await _db.StudentGroupDivisions
            .Include(x => x.StudentGroups)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == organizationId);
        if (division == null)
            return NotFound(new { message = "Division was not found." });

        var ids = division.StudentGroups.Select(x => x.Id).ToList();
        if (await _db.LessonRequirements.AnyAsync(
                x => x.StudentGroupId.HasValue &&
                     ids.Contains(x.StudentGroupId.Value)) ||
            await _db.StudentGroupMembers.AnyAsync(
                x => ids.Contains(x.MemberGroupId)))
            return Conflict(new
            {
                code = "division_in_use",
                message = "Division contains groups that are already in use."
            });

        _db.StudentGroupDivisions.Remove(division);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task EnsureWholeClassGroupsAsync(int organizationId)
    {
        var classes = await _db.ClassGroups
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync();
        var existingClassIds = await _db.StudentGroups
            .Where(x => x.OrganizationId == organizationId &&
                        x.Type == StudentGroupType.WholeClass &&
                        x.ClassGroupId.HasValue)
            .Select(x => x.ClassGroupId!.Value)
            .ToListAsync();
        var existing = existingClassIds.ToHashSet();

        foreach (var classGroup in classes.Where(x => !existing.Contains(x.Id)))
        {
            _db.StudentGroups.Add(new StudentGroup
            {
                OrganizationId = organizationId,
                ClassGroupId = classGroup.Id,
                Name = classGroup.Name,
                Type = StudentGroupType.WholeClass
            });
        }
        await _db.SaveChangesAsync();
    }

    private static StudentGroupDto ToDto(StudentGroup group) => new()
    {
        Id = group.Id,
        Name = group.Name,
        Type = group.Type,
        ClassGroupId = group.ClassGroupId,
        ClassGroupName = group.ClassGroup?.Name,
        DivisionId = group.DivisionId,
        DivisionName = group.Division?.Name,
        MemberGroupIds = group.Members.Select(x => x.MemberGroupId).ToList(),
        MemberGroupNames = group.Members.Select(x => x.MemberGroup.Name).ToList()
    };
}
