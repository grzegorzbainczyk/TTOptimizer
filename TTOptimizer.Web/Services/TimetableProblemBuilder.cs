using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Services;

public class TimetableProblemBuilder
{
    private readonly AppDbContext _context;

    public TimetableProblemBuilder(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TimetableProblem> BuildAsync(int organizationId)
    {
        var teachers = await _context.Teachers
            .Where(t => t.OrganizationId == organizationId)
            .OrderBy(t => t.Id)
            .ToListAsync();

        var classGroups = await _context.ClassGroups
            .Where(c => c.OrganizationId == organizationId)
            .OrderBy(c => c.Id)
            .ToListAsync();

        var subjects = await _context.Subjects
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Id)
            .ToListAsync();

        var rooms = await _context.Rooms
            .Where(r => r.OrganizationId == organizationId)
            .OrderBy(r => r.Id)
            .ToListAsync();

        var lessonRequirements = await _context.LessonRequirements
            .Where(lr => lr.OrganizationId == organizationId)
            .OrderBy(lr => lr.Id)
            .ToListAsync();

        ValidateData(
            organizationId,
            teachers,
            classGroups,
            subjects,
            rooms,
            lessonRequirements);

        return new TimetableProblem
        {
            Teachers = teachers,
            ClassGroups = classGroups,
            Subjects = subjects,
            Rooms = rooms,
            LessonRequirements = lessonRequirements,
            DaysPerWeek = 5,
            SlotsPerDay = 8
        };
    }

    private static void ValidateData(
        int organizationId,
        List<Teacher> teachers,
        List<ClassGroup> classGroups,
        List<Subject> subjects,
        List<Room> rooms,
        List<LessonRequirement> lessonRequirements)
    {
        if (teachers.Count == 0)
            throw new InvalidOperationException($"No teachers found for OrganizationId={organizationId}.");

        if (classGroups.Count == 0)
            throw new InvalidOperationException($"No class groups found for OrganizationId={organizationId}.");

        if (subjects.Count == 0)
            throw new InvalidOperationException($"No subjects found for OrganizationId={organizationId}.");

        if (rooms.Count == 0)
            throw new InvalidOperationException($"No rooms found for OrganizationId={organizationId}.");

        if (lessonRequirements.Count == 0)
            throw new InvalidOperationException($"No lesson requirements found for OrganizationId={organizationId}.");

        var teacherIds = teachers.Select(t => t.Id).ToHashSet();
        var classGroupIds = classGroups.Select(c => c.Id).ToHashSet();
        var subjectIds = subjects.Select(s => s.Id).ToHashSet();

        var invalidRequirements = lessonRequirements
            .Where(lr =>
                !teacherIds.Contains(lr.TeacherId) ||
                !classGroupIds.Contains(lr.ClassGroupId) ||
                !subjectIds.Contains(lr.SubjectId))
            .ToList();

        if (invalidRequirements.Count > 0)
        {
            var details = string.Join("; ", invalidRequirements.Select(lr =>
                $"RequirementId={lr.Id}, TeacherId={lr.TeacherId}, ClassGroupId={lr.ClassGroupId}, SubjectId={lr.SubjectId}"));

            throw new InvalidOperationException(
                $"Invalid lesson requirements for OrganizationId={organizationId}: {details}");
        }
    }
}