namespace TTOptimizer.Web.Models.Domain;

public class TeacherSchedulingPreferences
{
    public int Id { get; set; }

    public int TeacherId { get; set; }

    // null means: use organization default
    public SchedulingPreferenceLevel? MinimizeGaps { get; set; }

    public Teacher Teacher { get; set; } = null!;
}
