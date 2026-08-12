namespace TTOptimizer.Web.Models.Domain;

public class OrganizationSchedulingPreferences
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public SchedulingPreferenceLevel TeacherAvoidSingleLessonDay { get; set; }
        = SchedulingPreferenceLevel.Low;

    public SchedulingPreferenceLevel TeacherMaxConsecutiveLessons { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public int TeacherMaxConsecutiveLessonsLimit { get; set; } = 4;

    public SchedulingPreferenceLevel TeacherMaxLessonsPerDay { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public int TeacherMaxLessonsPerDayLimit { get; set; } = 6;

    public Organization Organization { get; set; } = null!;
}
