namespace TTOptimizer.Web.Models.DTO.Requirements;

public class CreateStudentGroupLessonRequirementRequest
{
    public int TeacherId { get; set; }
    public int StudentGroupId { get; set; }
    public int SubjectId { get; set; }
    public int HoursPerWeek { get; set; }
}

public class UpdateStudentGroupLessonRequirementRequest
{
    public int TeacherId { get; set; }
    public int StudentGroupId { get; set; }
    public int SubjectId { get; set; }
    public int HoursPerWeek { get; set; }
}
