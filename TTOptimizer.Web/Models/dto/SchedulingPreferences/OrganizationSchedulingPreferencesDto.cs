using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.SchedulingPreferences;

public class OrganizationSchedulingPreferencesDto
{
    public int OrganizationId { get; set; }

    public string OrganizationName { get; set; } = string.Empty;

    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
}

public class UpdateOrganizationSchedulingPreferencesRequest
{
    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
}
