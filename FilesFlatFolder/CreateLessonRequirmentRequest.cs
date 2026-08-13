namespace TTOptimizer.Web.Models.DTO.Requirements;

public class CreateLessonRequirementRequest
{
    public int TeacherId { get; set; }

    public int ClassGroupId { get; set; }

    public int SubjectId { get; set; }

    public int HoursPerWeek { get; set; }
}