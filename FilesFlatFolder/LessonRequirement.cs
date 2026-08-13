using TTOptimizer.Web.Models.Domain;

public class LessonRequirement
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public int ClassGroupId { get; set; }

    public int SubjectId { get; set; }

    public int TeacherId { get; set; }

    public int HoursPerWeek { get; set; }

    public Organization Organization { get; set; } = null!;

    public ClassGroup ClassGroup { get; set; } = null!;

    public Subject Subject { get; set; } = null!;

    public Teacher Teacher { get; set; } = null!;
}