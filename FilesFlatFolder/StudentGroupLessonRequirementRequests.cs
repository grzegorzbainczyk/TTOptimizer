using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.Requirements;

public class CreateStudentGroupLessonRequirementRequest
{
    public string? Name { get; set; }
    public bool IsAdditional { get; set; }
    public int TeacherId { get; set; }
    public int StudentGroupId { get; set; }
    public int SubjectId { get; set; }
    public int HoursPerWeek { get; set; }
    public LessonPriority Priority { get; set; } = LessonPriority.Normal;
}

public class UpdateStudentGroupLessonRequirementRequest
{
    public string? Name { get; set; }
    public bool IsAdditional { get; set; }
    public int TeacherId { get; set; }
    public int StudentGroupId { get; set; }
    public int SubjectId { get; set; }
    public int HoursPerWeek { get; set; }
    public LessonPriority Priority { get; set; } = LessonPriority.Normal;
}
