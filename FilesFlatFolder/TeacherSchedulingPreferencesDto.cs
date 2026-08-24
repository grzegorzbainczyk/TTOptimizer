using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.SchedulingPreferences;

public class TeacherSchedulingPreferencesDto
{
    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public SchedulingPreferenceLevel? MinimizeGaps { get; set; }
    public SchedulingPreferenceLevel DefaultMinimizeGaps { get; set; }
    public SchedulingPreferenceLevel EffectiveMinimizeGaps { get; set; }

    public SchedulingPreferenceLevel? AvoidSingleLessonDay { get; set; }
    public SchedulingPreferenceLevel DefaultAvoidSingleLessonDay { get; set; }
    public SchedulingPreferenceLevel EffectiveAvoidSingleLessonDay { get; set; }

    public SchedulingPreferenceLevel? MaxConsecutiveLessons { get; set; }
    public SchedulingPreferenceLevel DefaultMaxConsecutiveLessons { get; set; }
    public SchedulingPreferenceLevel EffectiveMaxConsecutiveLessons { get; set; }

    public int? MaxConsecutiveLessonsLimit { get; set; }
    public int DefaultMaxConsecutiveLessonsLimit { get; set; }
    public int EffectiveMaxConsecutiveLessonsLimit { get; set; }

    public SchedulingPreferenceLevel? MaxLessonsPerDay { get; set; }
    public SchedulingPreferenceLevel DefaultMaxLessonsPerDay { get; set; }
    public SchedulingPreferenceLevel EffectiveMaxLessonsPerDay { get; set; }

    public int? MaxLessonsPerDayLimit { get; set; }
    public int DefaultMaxLessonsPerDayLimit { get; set; }
    public int EffectiveMaxLessonsPerDayLimit { get; set; }
}

public class UpdateTeacherSchedulingPreferencesRequest
{
    public SchedulingPreferenceLevel? MinimizeGaps { get; set; }

    public SchedulingPreferenceLevel? AvoidSingleLessonDay { get; set; }

    public SchedulingPreferenceLevel? MaxConsecutiveLessons { get; set; }

    public int? MaxConsecutiveLessonsLimit { get; set; }

    public SchedulingPreferenceLevel? MaxLessonsPerDay { get; set; }

    public int? MaxLessonsPerDayLimit { get; set; }
}
