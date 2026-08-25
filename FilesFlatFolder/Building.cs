namespace TTOptimizer.Web.Models.Domain;

public class Building
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? Info { get; set; }

    public Organization Organization { get; set; } = null!;

    public List<Room> Rooms { get; set; } = new();
}
