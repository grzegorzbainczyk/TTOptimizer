using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.Optimization;

namespace TTOptimizer.Web.Models.DTO;

/// <summary>
/// Represents the complete timetable problem passed from the web application
/// to the optimization engine.
/// </summary>
/// <remarks>
/// The object contains the timetable dimensions, available domain resources,
/// lesson requirements, time slot preferences, and optimization settings.
/// </remarks>
public class OptimizerInputDto
{
    /// <summary>
    /// Gets or sets the number of teaching days included in the timetable.
    /// </summary>
    public int DaysPerWeek { get; set; }

    /// <summary>
    /// Gets or sets the number of available lesson slots during each teaching day.
    /// </summary>
    public int SlotsPerDay { get; set; }

    /// <summary>
    /// Gets or sets the collection of teachers available in the timetable problem.
    /// </summary>
    public List<OptimizerTeacherDto> Teachers { get; set; } = new();

    /// <summary>
    /// Gets or sets the collection of class groups included in the timetable problem.
    /// </summary>
    public List<OptimizerClassGroupDto> Classes { get; set; } = new();

    /// <summary>
    /// Gets or sets the collection of subjects included in the timetable problem.
    /// </summary>
    public List<OptimizerSubjectDto> Subjects { get; set; } = new();

    /// <summary>
    /// Gets or sets the collection of rooms available for scheduling lessons.
    /// </summary>
    public List<OptimizerRoomDto> Rooms { get; set; } = new();

    /// <summary>
    /// Gets or sets the collection of lesson requirements that must be scheduled
    /// by the optimization engine.
    /// </summary>
    public List<OptimizerLessonRequirementDto> LessonRequirements { get; set; } = new();

    /// <summary>
    /// Gets or sets non-default time slot preferences for teachers.
    /// Missing slots are treated as Available by the optimization engine.
    /// </summary>
    public List<TeacherTimeSlotPreferenceInput> TeacherTimeSlotPreferences { get; set; } = new();

    /// <summary>
    /// Gets or sets non-default time slot preferences for class groups.
    /// Missing slots are treated as Available by the optimization engine.
    /// </summary>
    public List<ClassGroupTimeSlotPreferenceInput> ClassGroupTimeSlotPreferences { get; set; } = new();

    /// <summary>
    /// Gets or sets non-default time slot preferences for rooms.
    /// Missing slots are treated as Available by the optimization engine.
    /// </summary>
    public List<RoomTimeSlotPreferenceInput> RoomTimeSlotPreferences { get; set; } = new();

    /// <summary>
    /// Gets or sets non-default time slot preferences for subjects.
    /// Missing slots are treated as Available by the optimization engine.
    /// </summary>
    public List<SubjectTimeSlotPreferenceInput> SubjectTimeSlotPreferences { get; set; } = new();

    /// <summary>
    /// Gets or sets the effective scheduling preferences for teachers.
    /// Values already include organization defaults and teacher overrides.
    /// </summary>
    public List<TeacherSchedulingPreferenceInput> TeacherSchedulingPreferences { get; set; } = new();

    /// <summary>
    /// Gets or sets the configuration used by the optimization algorithm,
    /// such as iteration limits, random seed, and thread count.
    /// </summary>
    public required OptimizationSettings OptimizationSettings { get; set; }
}

/// <summary>
/// Represents a teacher passed to the optimization engine.
/// </summary>
public class OptimizerTeacherDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the teacher.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the teacher's display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Represents a class group passed to the optimization engine.
/// </summary>
public class OptimizerClassGroupDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the class group.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the class group's display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Represents a subject passed to the optimization engine.
/// </summary>
public class OptimizerSubjectDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the subject.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the subject's display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Represents a room available to the optimization engine.
/// </summary>
public class OptimizerRoomDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the room.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the room's display name or number.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the maximum number of students that can use the room.
    /// </summary>
    public int Capacity { get; set; }
}

/// <summary>
/// Represents a lesson requirement that must be converted into one or more
/// scheduled lesson instances by the optimization engine.
/// </summary>
public class OptimizerLessonRequirementDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the lesson requirement.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the teacher assigned to the requirement.
    /// </summary>
    public int TeacherId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the class group assigned to the requirement.
    /// </summary>
    public int ClassGroupId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the subject assigned to the requirement.
    /// </summary>
    public int SubjectId { get; set; }

    /// <summary>
    /// Gets or sets the number of lesson instances that must be scheduled
    /// during one week.
    /// </summary>
    public int LessonsPerWeek { get; set; }
}