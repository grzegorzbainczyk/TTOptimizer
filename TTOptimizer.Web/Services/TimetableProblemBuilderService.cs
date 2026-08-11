using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.Optimization;

namespace TTOptimizer.Web.Services;

public class TimetableProblemBuilderService
{
    private readonly AppDbContext _context;

    public TimetableProblemBuilderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TimetableProblemBuildResult> BuildAsync(
        int organizationId,
        OptimizationSettings optimizationSettings)
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

        var teacherTimeSlotPreferences =
            await _context.TeacherTimeSlotPreferences
                .AsNoTracking()
                .Where(item =>
                    item.Teacher.OrganizationId == organizationId)
                .OrderBy(item => item.TeacherId)
                .ThenBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new TeacherTimeSlotPreferenceInput
                {
                    TeacherId = item.TeacherId,
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex,
                    PreferenceType = item.PreferenceType
                })
                .ToListAsync();

        var classGroupTimeSlotPreferences =
            await _context.ClassGroupTimeSlotPreferences
                .AsNoTracking()
                .Where(item =>
                    item.ClassGroup.OrganizationId == organizationId)
                .OrderBy(item => item.ClassGroupId)
                .ThenBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new ClassGroupTimeSlotPreferenceInput
                {
                    ClassGroupId = item.ClassGroupId,
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex,
                    PreferenceType = item.PreferenceType
                })
                .ToListAsync();

        var roomTimeSlotPreferences =
            await _context.RoomTimeSlotPreferences
                .AsNoTracking()
                .Where(item =>
                    item.Room.OrganizationId == organizationId)
                .OrderBy(item => item.RoomId)
                .ThenBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new RoomTimeSlotPreferenceInput
                {
                    RoomId = item.RoomId,
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex,
                    PreferenceType = item.PreferenceType
                })
                .ToListAsync();

        var subjectTimeSlotPreferences =
            await _context.SubjectTimeSlotPreferences
                .AsNoTracking()
                .Where(item =>
                    item.Subject.OrganizationId == organizationId)
                .OrderBy(item => item.SubjectId)
                .ThenBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new SubjectTimeSlotPreferenceInput
                {
                    SubjectId = item.SubjectId,
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex,
                    PreferenceType = item.PreferenceType
                })
                .ToListAsync();

        ValidationResult validate = ValidateData(
            teachers,
            classGroups,
            subjects,
            rooms,
            lessonRequirements);

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

            TeacherTimeSlotPreferences = teacherTimeSlotPreferences,
            ClassGroupTimeSlotPreferences = classGroupTimeSlotPreferences,
            RoomTimeSlotPreferences = roomTimeSlotPreferences,
            SubjectTimeSlotPreferences = subjectTimeSlotPreferences,

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
}
