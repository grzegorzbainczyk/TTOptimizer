namespace TTOptimizer.Web.Models.Domain;

public class OrganizationSchedulingPreferences
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
        = SchedulingPreferenceLevel.Medium;

    public Organization Organization { get; set; } = null!;
}
