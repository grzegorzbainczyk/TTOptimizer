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

        await EnsureWholeClassStudentGroupsAsync(
            organizationId,
            classGroups);

        var studentGroupEntities = await _context.StudentGroups
            .Where(group => group.OrganizationId == organizationId)
            .Include(group => group.Members)
                .ThenInclude(member => member.MemberGroup)
            .OrderBy(group => group.Id)
            .ToListAsync();

        var wholeClassGroupByClassId = studentGroupEntities
            .Where(group => group.Type == StudentGroupType.WholeClass && group.ClassGroupId.HasValue)
            .ToDictionary(group => group.ClassGroupId!.Value, group => group.Id);

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

        foreach (var requirement in lessonRequirements)
        {
            if (requirement.StudentGroupId.HasValue)
            {
                continue;
            }

            if (requirement.ClassGroupId.HasValue &&
                wholeClassGroupByClassId.TryGetValue(
                    requirement.ClassGroupId.Value,
                    out var wholeClassStudentGroupId))
            {
                requirement.StudentGroupId = wholeClassStudentGroupId;
            }
        }

        var studentGroupById =
            studentGroupEntities.ToDictionary(group => group.Id);

        foreach (var requirement in lessonRequirements)
        {
            if (requirement.ClassGroupId.HasValue ||
                !requirement.StudentGroupId.HasValue)
            {
                continue;
            }

            if (!studentGroupById.TryGetValue(
                    requirement.StudentGroupId.Value,
                    out var studentGroup))
            {
                continue;
            }

            // Individual and subgroup requirements target a concrete source class.
            // Keep ClassGroupId as compatibility data for the optimizer input,
            // while StudentGroupId remains the real scheduling target.
            if (studentGroup.ClassGroupId.HasValue)
            {
                requirement.ClassGroupId =
                    studentGroup.ClassGroupId.Value;
            }
        }

        var studentGroups = BuildStudentGroupInputs(studentGroupEntities);
        var studentGroupConflicts = BuildStudentGroupConflicts(studentGroupEntities);

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

        var organizationSchedulingPreferences =
            await _context.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        var defaultTeacherMinimizeGaps =
            organizationSchedulingPreferences?.TeacherMinimizeGaps
            ?? SchedulingPreferenceLevel.Medium;

        var defaultTeacherAvoidSingleLessonDay =
            organizationSchedulingPreferences?.TeacherAvoidSingleLessonDay
            ?? SchedulingPreferenceLevel.Low;

        var defaultTeacherAvoidImmediateBuildingChange =
            organizationSchedulingPreferences?.TeacherAvoidImmediateBuildingChange
            ?? SchedulingPreferenceLevel.Medium;

        var defaultTeacherMaxConsecutiveLessons =
            organizationSchedulingPreferences?.TeacherMaxConsecutiveLessons
            ?? SchedulingPreferenceLevel.Medium;

        var defaultTeacherMaxConsecutiveLessonsLimit =
            organizationSchedulingPreferences?.TeacherMaxConsecutiveLessonsLimit
            ?? 4;

        var defaultTeacherMaxLessonsPerDay =
            organizationSchedulingPreferences?.TeacherMaxLessonsPerDay
            ?? SchedulingPreferenceLevel.Medium;

        var defaultTeacherMaxLessonsPerDayLimit =
            organizationSchedulingPreferences?.TeacherMaxLessonsPerDayLimit
            ?? 6;

        var defaultStudentGroupAvoidImmediateBuildingChange =
            organizationSchedulingPreferences?.StudentGroupAvoidImmediateBuildingChange
            ?? SchedulingPreferenceLevel.Medium;

        var defaultClassGroupMinimizeGaps =
            organizationSchedulingPreferences?.ClassGroupMinimizeGaps
            ?? SchedulingPreferenceLevel.Medium;

        var defaultClassGroupAvoidSingleLessonDay =
            organizationSchedulingPreferences?.ClassGroupAvoidSingleLessonDay
            ?? SchedulingPreferenceLevel.Disabled;

        var defaultClassGroupMaxConsecutiveLessons =
            organizationSchedulingPreferences?.ClassGroupMaxConsecutiveLessons
            ?? SchedulingPreferenceLevel.Medium;

        var defaultClassGroupMaxConsecutiveLessonsLimit =
            organizationSchedulingPreferences?.ClassGroupMaxConsecutiveLessonsLimit
            ?? 6;

        var defaultClassGroupMaxLessonsPerDay =
            organizationSchedulingPreferences?.ClassGroupMaxLessonsPerDay
            ?? SchedulingPreferenceLevel.High;

        var defaultClassGroupMaxLessonsPerDayLimit =
            organizationSchedulingPreferences?.ClassGroupMaxLessonsPerDayLimit
            ?? 8;

        var defaultSubjectSpreadAcrossDays =
            organizationSchedulingPreferences?.SubjectSpreadAcrossDays
            ?? SchedulingPreferenceLevel.Medium;

        var defaultSubjectMaxOccurrencesPerDay =
            organizationSchedulingPreferences?.SubjectMaxOccurrencesPerDay
            ?? SchedulingPreferenceLevel.Medium;

        var defaultSubjectMaxOccurrencesPerDayLimit =
            organizationSchedulingPreferences?.SubjectMaxOccurrencesPerDayLimit
            ?? 1;

        var defaultSubjectPreferDoubleLessons =
            organizationSchedulingPreferences?.SubjectPreferDoubleLessons
            ?? SchedulingPreferenceLevel.Disabled;

        var defaultSubjectAvoidDoubleLessons =
            organizationSchedulingPreferences?.SubjectAvoidDoubleLessons
            ?? SchedulingPreferenceLevel.Disabled;

        var teacherPreferenceOverrides =
            await _context.TeacherSchedulingPreferences
                .AsNoTracking()
                .Where(item =>
                    item.Teacher.OrganizationId == organizationId)
                .ToDictionaryAsync(
                    item => item.TeacherId);

        var teacherSchedulingPreferences =
            teachers
                .Select(teacher =>
                {
                    teacherPreferenceOverrides.TryGetValue(
                        teacher.Id,
                        out var overrideValue);

                    return new TeacherSchedulingPreferenceInput
                    {
                        TeacherId = teacher.Id,

                        MinimizeGaps =
                            overrideValue?.MinimizeGaps
                            ?? defaultTeacherMinimizeGaps,

                        AvoidSingleLessonDay =
                            overrideValue?.AvoidSingleLessonDay
                            ?? defaultTeacherAvoidSingleLessonDay,

                        // Building transitions are organization-wide for now.
                        AvoidImmediateBuildingChange =
                            defaultTeacherAvoidImmediateBuildingChange,

                        MaxConsecutiveLessons =
                            overrideValue?.MaxConsecutiveLessons
                            ?? defaultTeacherMaxConsecutiveLessons,

                        MaxConsecutiveLessonsLimit =
                            overrideValue?.MaxConsecutiveLessonsLimit
                            ?? defaultTeacherMaxConsecutiveLessonsLimit,

                        MaxLessonsPerDay =
                            overrideValue?.MaxLessonsPerDay
                            ?? defaultTeacherMaxLessonsPerDay,

                        MaxLessonsPerDayLimit =
                            overrideValue?.MaxLessonsPerDayLimit
                            ?? defaultTeacherMaxLessonsPerDayLimit
                    };
                })
                .ToList();

        var classGroupPreferenceOverrides =
            await _context.ClassGroupSchedulingPreferences
                .AsNoTracking()
                .Where(item =>
                    item.ClassGroup.OrganizationId == organizationId)
                .ToDictionaryAsync(
                    item => item.ClassGroupId);

        var classGroupSchedulingPreferences =
            classGroups
                .Select(classGroup =>
                {
                    classGroupPreferenceOverrides.TryGetValue(
                        classGroup.Id,
                        out var overrideValue);

                    return new ClassGroupSchedulingPreferenceInput
                    {
                        ClassGroupId = classGroup.Id,

                        MinimizeGaps =
                            overrideValue?.MinimizeGaps
                            ?? defaultClassGroupMinimizeGaps,

                        AvoidSingleLessonDay =
                            overrideValue?.AvoidSingleLessonDay
                            ?? defaultClassGroupAvoidSingleLessonDay,

                        MaxConsecutiveLessons =
                            overrideValue?.MaxConsecutiveLessons
                            ?? defaultClassGroupMaxConsecutiveLessons,

                        MaxConsecutiveLessonsLimit =
                            overrideValue?.MaxConsecutiveLessonsLimit
                            ?? defaultClassGroupMaxConsecutiveLessonsLimit,

                        MaxLessonsPerDay =
                            overrideValue?.MaxLessonsPerDay
                            ?? defaultClassGroupMaxLessonsPerDay,

                        MaxLessonsPerDayLimit =
                            overrideValue?.MaxLessonsPerDayLimit
                            ?? defaultClassGroupMaxLessonsPerDayLimit
                    };
                })
                .ToList();

        var subjectPreferenceOverrides =
            await _context.SubjectSchedulingPreferences
                .AsNoTracking()
                .Where(item =>
                    item.Subject.OrganizationId == organizationId)
                .ToDictionaryAsync(
                    item => item.SubjectId);

        var subjectSchedulingPreferences =
            subjects
                .Select(subject =>
                {
                    subjectPreferenceOverrides.TryGetValue(
                        subject.Id,
                        out var overrideValue);

                    return new SubjectSchedulingPreferenceInput
                    {
                        SubjectId = subject.Id,

                        SpreadAcrossDays =
                            overrideValue?.SpreadAcrossDays
                            ?? defaultSubjectSpreadAcrossDays,

                        MaxOccurrencesPerDay =
                            overrideValue?.MaxOccurrencesPerDay
                            ?? defaultSubjectMaxOccurrencesPerDay,

                        MaxOccurrencesPerDayLimit =
                            overrideValue?.MaxOccurrencesPerDayLimit
                            ?? defaultSubjectMaxOccurrencesPerDayLimit,

                        PreferDoubleLessons =
                            overrideValue?.PreferDoubleLessons
                            ?? defaultSubjectPreferDoubleLessons,

                        AvoidDoubleLessons =
                            overrideValue?.AvoidDoubleLessons
                            ?? defaultSubjectAvoidDoubleLessons,

                        PreferredRoomId =
                            overrideValue?.PreferredRoomId ?? 0,

                        PreferredRoomImportance =
                            overrideValue?.PreferredRoomId != null
                                ? overrideValue.PreferredRoomImportance
                                    ?? SchedulingPreferenceLevel.Hard
                                : SchedulingPreferenceLevel.Disabled
                    };
                })
                .ToList();

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
            StudentGroups = studentGroups,
            StudentGroupConflicts = studentGroupConflicts,
            LessonRequirements = lessonRequirements,

            StudentGroupAvoidImmediateBuildingChange =
                defaultStudentGroupAvoidImmediateBuildingChange,

            TeacherTimeSlotPreferences = teacherTimeSlotPreferences,
            ClassGroupTimeSlotPreferences = classGroupTimeSlotPreferences,
            RoomTimeSlotPreferences = roomTimeSlotPreferences,
            SubjectTimeSlotPreferences = subjectTimeSlotPreferences,

            TeacherSchedulingPreferences = teacherSchedulingPreferences,
            ClassGroupSchedulingPreferences = classGroupSchedulingPreferences,
            SubjectSchedulingPreferences = subjectSchedulingPreferences,

            DaysPerWeek = 5,
            SlotsPerDay = 8,
            OptimizationSettings = optimizationSettings
        };

        return TimetableProblemBuildResult.Ok(problem);
    }

    private async Task EnsureWholeClassStudentGroupsAsync(
        int organizationId,
        IReadOnlyCollection<ClassGroup> classGroups)
    {
        var existingClassIds = (await _context.StudentGroups
            .Where(group =>
                group.OrganizationId == organizationId &&
                group.Type == StudentGroupType.WholeClass &&
                group.ClassGroupId.HasValue)
            .Select(group => group.ClassGroupId!.Value)
            .ToListAsync())
            .ToHashSet();

        foreach (var classGroup in classGroups)
        {
            if (existingClassIds.Contains(classGroup.Id))
            {
                continue;
            }

            _context.StudentGroups.Add(new StudentGroup
            {
                OrganizationId = organizationId,
                ClassGroupId = classGroup.Id,
                Name = classGroup.Name,
                Type = StudentGroupType.WholeClass
            });
        }

        await _context.SaveChangesAsync();
    }

    private static List<StudentGroupInput> BuildStudentGroupInputs(
        IReadOnlyCollection<StudentGroup> groups)
    {
        var byId = groups.ToDictionary(group => group.Id);

        List<int> ResolveClassGroupIds(StudentGroup group)
        {
            if (group.Type != StudentGroupType.Combined)
            {
                return group.ClassGroupId.HasValue
                    ? new List<int> { group.ClassGroupId.Value }
                    : new List<int>();
            }

            return group.Members
                .Select(member => byId.GetValueOrDefault(member.MemberGroupId))
                .Where(member => member != null)
                .SelectMany(member => ResolveClassGroupIds(member!))
                .Distinct()
                .OrderBy(id => id)
                .ToList();
        }

        return groups.Select(group => new StudentGroupInput
        {
            Id = group.Id,
            Name = group.Name,
            Type = group.Type,
            ClassGroupId = group.ClassGroupId,
            DivisionId = group.DivisionId,
            ClassGroupIds = ResolveClassGroupIds(group)
        }).ToList();
    }

    private static List<StudentGroupConflictInput> BuildStudentGroupConflicts(
        IReadOnlyCollection<StudentGroup> groups)
    {
        var list = groups.OrderBy(group => group.Id).ToList();
        var byId = list.ToDictionary(group => group.Id);

        bool Conflicts(StudentGroup first, StudentGroup second)
        {
            if (first.Id == second.Id)
            {
                return true;
            }

            if (first.Type == StudentGroupType.Combined)
            {
                return first.Members.Any(member =>
                    byId.TryGetValue(member.MemberGroupId, out var memberGroup) &&
                    Conflicts(memberGroup, second));
            }

            if (second.Type == StudentGroupType.Combined)
            {
                return second.Members.Any(member =>
                    byId.TryGetValue(member.MemberGroupId, out var memberGroup) &&
                    Conflicts(first, memberGroup));
            }

            if (!first.ClassGroupId.HasValue ||
                first.ClassGroupId != second.ClassGroupId)
            {
                return false;
            }

            if (first.Type == StudentGroupType.Individual &&
                second.Type == StudentGroupType.Individual)
            {
                return false;
            }

            if (first.Type == StudentGroupType.Subgroup &&
                second.Type == StudentGroupType.Subgroup &&
                first.DivisionId.HasValue &&
                first.DivisionId == second.DivisionId)
            {
                return false;
            }

            return true;
        }

        var result = new List<StudentGroupConflictInput>();
        for (var firstIndex = 0; firstIndex < list.Count; firstIndex++)
        {
            for (var secondIndex = firstIndex + 1; secondIndex < list.Count; secondIndex++)
            {
                if (!Conflicts(list[firstIndex], list[secondIndex]))
                {
                    continue;
                }

                result.Add(new StudentGroupConflictInput
                {
                    FirstStudentGroupId = list[firstIndex].Id,
                    SecondStudentGroupId = list[secondIndex].Id
                });
            }
        }

        return result;
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
