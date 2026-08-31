using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.SchedulingPreferences;

public class SubjectSchedulingPreferencesDto
{
    public int SubjectId { get; set; }

    public string SubjectName { get; set; } = string.Empty;

    public SchedulingPreferenceLevel? SpreadAcrossDays { get; set; }
    public SchedulingPreferenceLevel DefaultSpreadAcrossDays { get; set; }
    public SchedulingPreferenceLevel EffectiveSpreadAcrossDays { get; set; }

    public SchedulingPreferenceLevel? MaxOccurrencesPerDay { get; set; }
    public SchedulingPreferenceLevel DefaultMaxOccurrencesPerDay { get; set; }
    public SchedulingPreferenceLevel EffectiveMaxOccurrencesPerDay { get; set; }

    public int? MaxOccurrencesPerDayLimit { get; set; }
    public int DefaultMaxOccurrencesPerDayLimit { get; set; }
    public int EffectiveMaxOccurrencesPerDayLimit { get; set; }

    public SchedulingPreferenceLevel? PreferDoubleLessons { get; set; }
    public SchedulingPreferenceLevel DefaultPreferDoubleLessons { get; set; }
    public SchedulingPreferenceLevel EffectivePreferDoubleLessons { get; set; }

    public SchedulingPreferenceLevel? AvoidDoubleLessons { get; set; }
    public SchedulingPreferenceLevel DefaultAvoidDoubleLessons { get; set; }
    public SchedulingPreferenceLevel EffectiveAvoidDoubleLessons { get; set; }

    public int? PreferredRoomId { get; set; }

    public SchedulingPreferenceLevel? PreferredRoomImportance { get; set; }
}

public class UpdateSubjectSchedulingPreferencesRequest
{
    public SchedulingPreferenceLevel? SpreadAcrossDays { get; set; }

    public SchedulingPreferenceLevel? MaxOccurrencesPerDay { get; set; }

    public int? MaxOccurrencesPerDayLimit { get; set; }

    public SchedulingPreferenceLevel? PreferDoubleLessons { get; set; }

    public SchedulingPreferenceLevel? AvoidDoubleLessons { get; set; }

    public int? PreferredRoomId { get; set; }

    public SchedulingPreferenceLevel? PreferredRoomImportance { get; set; }
}
