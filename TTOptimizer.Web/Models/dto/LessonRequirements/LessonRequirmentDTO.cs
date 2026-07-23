namespace TTOptimizer.Web.Models.DTO.Requirements;

public class LessonRequirementDTO
{
    public int Id { get; set; }

    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public int ClassGroupId { get; set; }

    public string ClassName { get; set; } = string.Empty;

    public int SubjectId { get; set; }

    public string SubjectName { get; set; } = string.Empty;

    public int HoursPerWeek { get; set; }
}