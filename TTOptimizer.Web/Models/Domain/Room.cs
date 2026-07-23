using TTOptimizer.Web.Models.Domain;

public class Room
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public int? RestrictedToSubjectId { get; set; }

    public int? PreferredSubjectId { get; set; }

    public Organization Organization { get; set; } = null!;

    public Subject? RestrictedToSubject { get; set; }

    public Subject? PreferredSubject { get; set; }
}