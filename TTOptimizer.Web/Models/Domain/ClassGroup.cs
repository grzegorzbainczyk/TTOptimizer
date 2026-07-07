using TTOptimizer.Web.Models.Domain;

public class ClassGroup
{
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}