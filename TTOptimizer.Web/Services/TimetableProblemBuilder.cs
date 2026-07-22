using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.Optimization;

namespace TTOptimizer.Web.Services;

public class TimetableProblemBuilder
{
    private readonly AppDbContext _context;

    public TimetableProblemBuilder(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TimetableProblemBuildResult> BuildAsync(int organizationId, OptimizationSettings optimizationSettings)
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

        ValidationResult validate = ValidateData(teachers,classGroups,subjects,rooms,lessonRequirements);

        if (!validate.Success)
        {
            return TimetableProblemBuildResult.Fail(validate.Message);
        }

        var problem = new TimetableProblem
        {
            Teachers = teachers,
            ClassGroups = classGroups,
            Subjects = subjects,
            Rooms = rooms,
            LessonRequirements = lessonRequirements,
            DaysPerWeek = 5,
            SlotsPerDay = 8,
            OptimizationSettings = optimizationSettings
        };

        return TimetableProblemBuildResult.Ok(problem);
    }

    private static ValidationResult ValidateData(
    List<Teacher> teachers,
    List<ClassGroup> classes,
    List<Subject> subjects,
    List<Room> rooms,
    List<LessonRequirement> requirements)
    {
        if (!teachers.Any())
        {
            return ValidationResult.Fail("No teachers found.");
        }

        if (!classes.Any())
        {
            return ValidationResult.Fail("No classes found.");
        }

        if (!subjects.Any())
        {
            return ValidationResult.Fail("No subjects found.");
        }

        if (!rooms.Any())
        {
            return ValidationResult.Fail("No rooms found.");
        }

        if (!requirements.Any())
        {
            return ValidationResult.Fail("No lesson requirements found.");
        }

        return ValidationResult.Ok();
    }

    internal async Task BuildProblemAsync(int organizationId)
    {
        throw new NotImplementedException();
    }
}