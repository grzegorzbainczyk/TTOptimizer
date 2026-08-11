using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.SchedulingPreferences;

public class TeacherSchedulingPreferencesDto
{
    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public SchedulingPreferenceLevel? MinimizeGaps { get; set; }

    public SchedulingPreferenceLevel DefaultMinimizeGaps { get; set; }

    public SchedulingPreferenceLevel EffectiveMinimizeGaps { get; set; }
}

public class UpdateTeacherSchedulingPreferencesRequest
{
    public SchedulingPreferenceLevel? MinimizeGaps { get; set; }
}
