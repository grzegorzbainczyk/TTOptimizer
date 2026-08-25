namespace TTOptimizer.Web.Models.Domain;

public class ClassGroupSchedulingPreferences
{
    public int Id { get; set; }

    public int ClassGroupId { get; set; }

    // null means: use organization default
    public SchedulingPreferenceLevel? MinimizeGaps { get; set; }

    public SchedulingPreferenceLevel? AvoidSingleLessonDay { get; set; }

    public SchedulingPreferenceLevel? MaxConsecutiveLessons { get; set; }

    // null means: use organization default limit
    public int? MaxConsecutiveLessonsLimit { get; set; }

    public SchedulingPreferenceLevel? MaxLessonsPerDay { get; set; }

    // null means: use organization default limit
    public int? MaxLessonsPerDayLimit { get; set; }

    public ClassGroup ClassGroup { get; set; } = null!;
}
