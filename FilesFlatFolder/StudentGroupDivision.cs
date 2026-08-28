namespace TTOptimizer.Web.Models.Domain;

public class StudentGroupDivision
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public int ClassGroupId { get; set; }
    public string Name { get; set; } = string.Empty;

    public Organization Organization { get; set; } = null!;
    public ClassGroup ClassGroup { get; set; } = null!;
    public List<StudentGroup> StudentGroups { get; set; } = new();
}
