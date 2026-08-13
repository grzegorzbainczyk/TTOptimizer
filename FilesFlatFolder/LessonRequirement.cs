using TTOptimizer.Web.Models.Domain;

public class LessonRequirement
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }

    // Transitional compatibility field. New requirements use StudentGroupId as
    // the scheduling target. ClassGroupId is kept temporarily so existing data
    // and demo seeders continue to work during the migration.
    public int? ClassGroupId { get; set; }
    public int? StudentGroupId { get; set; }

    public int SubjectId { get; set; }
    public int TeacherId { get; set; }
    public int HoursPerWeek { get; set; }

    public Organization Organization { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
    public StudentGroup? StudentGroup { get; set; }
    public Subject Subject { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
}
