using TTOptimizer.Web.Models.Domain;

public class Subject
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public Organization Organization { get; set; } = null!;
}