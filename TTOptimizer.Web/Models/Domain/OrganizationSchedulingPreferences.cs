namespace TTOptimizer.Web.Models.Domain;

public class OrganizationSchedulingPreferences
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public SchedulingPreferenceLevel TeacherAvoidSingleLessonDay { get; set; }
        = SchedulingPreferenceLevel.Low;

    public SchedulingPreferenceLevel TeacherAvoidImmediateBuildingChange { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public SchedulingPreferenceLevel TeacherMaxConsecutiveLessons { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public int TeacherMaxConsecutiveLessonsLimit { get; set; } = 4;

    public SchedulingPreferenceLevel TeacherMaxLessonsPerDay { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public int TeacherMaxLessonsPerDayLimit { get; set; } = 6;


    public SchedulingPreferenceLevel ClassGroupMinimizeGaps { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public SchedulingPreferenceLevel ClassGroupAvoidSingleLessonDay { get; set; }
        = SchedulingPreferenceLevel.Disabled;

    public SchedulingPreferenceLevel ClassGroupMaxConsecutiveLessons { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public int ClassGroupMaxConsecutiveLessonsLimit { get; set; } = 6;

    public SchedulingPreferenceLevel ClassGroupMaxLessonsPerDay { get; set; }
        = SchedulingPreferenceLevel.High;

    public int ClassGroupMaxLessonsPerDayLimit { get; set; } = 8;


    public SchedulingPreferenceLevel SubjectSpreadAcrossDays { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public SchedulingPreferenceLevel SubjectMaxOccurrencesPerDay { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public int SubjectMaxOccurrencesPerDayLimit { get; set; } = 1;

    public SchedulingPreferenceLevel SubjectPreferDoubleLessons { get; set; }
        = SchedulingPreferenceLevel.Disabled;

    public SchedulingPreferenceLevel SubjectAvoidDoubleLessons { get; set; }
        = SchedulingPreferenceLevel.Disabled;

    public Organization Organization { get; set; } = null!;
}
