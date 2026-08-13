using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.SchedulingPreferences;

public class OrganizationSchedulingPreferencesDto
{
    public int OrganizationId { get; set; }

    public string OrganizationName { get; set; } = string.Empty;

    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
    public SchedulingPreferenceLevel TeacherAvoidSingleLessonDay { get; set; }
    public SchedulingPreferenceLevel TeacherAvoidImmediateBuildingChange { get; set; }
    public SchedulingPreferenceLevel TeacherMaxConsecutiveLessons { get; set; }
    public int TeacherMaxConsecutiveLessonsLimit { get; set; }
    public SchedulingPreferenceLevel TeacherMaxLessonsPerDay { get; set; }
    public int TeacherMaxLessonsPerDayLimit { get; set; }

    public SchedulingPreferenceLevel StudentGroupAvoidImmediateBuildingChange { get; set; }

    public SchedulingPreferenceLevel ClassGroupMinimizeGaps { get; set; }
    public SchedulingPreferenceLevel ClassGroupAvoidSingleLessonDay { get; set; }
    public SchedulingPreferenceLevel ClassGroupMaxConsecutiveLessons { get; set; }
    public int ClassGroupMaxConsecutiveLessonsLimit { get; set; }
    public SchedulingPreferenceLevel ClassGroupMaxLessonsPerDay { get; set; }
    public int ClassGroupMaxLessonsPerDayLimit { get; set; }

    public SchedulingPreferenceLevel SubjectSpreadAcrossDays { get; set; }
    public SchedulingPreferenceLevel SubjectMaxOccurrencesPerDay { get; set; }
    public int SubjectMaxOccurrencesPerDayLimit { get; set; }
    public SchedulingPreferenceLevel SubjectPreferDoubleLessons { get; set; }
    public SchedulingPreferenceLevel SubjectAvoidDoubleLessons { get; set; }
}

public class UpdateOrganizationSchedulingPreferencesRequest
{
    public SchedulingPreferenceLevel TeacherMinimizeGaps { get; set; }
    public SchedulingPreferenceLevel TeacherAvoidSingleLessonDay { get; set; }
    public SchedulingPreferenceLevel TeacherAvoidImmediateBuildingChange { get; set; }
    public SchedulingPreferenceLevel TeacherMaxConsecutiveLessons { get; set; }
    public int TeacherMaxConsecutiveLessonsLimit { get; set; }
    public SchedulingPreferenceLevel TeacherMaxLessonsPerDay { get; set; }
    public int TeacherMaxLessonsPerDayLimit { get; set; }

    public SchedulingPreferenceLevel StudentGroupAvoidImmediateBuildingChange { get; set; }

    public SchedulingPreferenceLevel ClassGroupMinimizeGaps { get; set; }
    public SchedulingPreferenceLevel ClassGroupAvoidSingleLessonDay { get; set; }
    public SchedulingPreferenceLevel ClassGroupMaxConsecutiveLessons { get; set; }
    public int ClassGroupMaxConsecutiveLessonsLimit { get; set; }
    public SchedulingPreferenceLevel ClassGroupMaxLessonsPerDay { get; set; }
    public int ClassGroupMaxLessonsPerDayLimit { get; set; }

    public SchedulingPreferenceLevel SubjectSpreadAcrossDays { get; set; }
    public SchedulingPreferenceLevel SubjectMaxOccurrencesPerDay { get; set; }
    public int SubjectMaxOccurrencesPerDayLimit { get; set; }
    public SchedulingPreferenceLevel SubjectPreferDoubleLessons { get; set; }
    public SchedulingPreferenceLevel SubjectAvoidDoubleLessons { get; set; }
}
