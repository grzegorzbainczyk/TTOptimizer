namespace TTOptimizer.Web.Models.Domain;

public class SubjectSchedulingPreferences
{
    public int Id { get; set; }

    public int SubjectId { get; set; }

    // null means: use organization default
    public SchedulingPreferenceLevel? SpreadAcrossDays { get; set; }

    public SchedulingPreferenceLevel? MaxOccurrencesPerDay { get; set; }

    // null means: use organization default limit
    public int? MaxOccurrencesPerDayLimit { get; set; }

    public SchedulingPreferenceLevel? PreferDoubleLessons { get; set; }

    public SchedulingPreferenceLevel? AvoidDoubleLessons { get; set; }

    public int? PreferredRoomId { get; set; }

    public SchedulingPreferenceLevel? PreferredRoomImportance { get; set; }

    public Subject Subject { get; set; } = null!;

    public Room? PreferredRoom { get; set; }
}
