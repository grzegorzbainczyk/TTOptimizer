using TTOptimizer.Web.Models.Domain;

public class ClassGroup
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public int? HomeroomTeacherId { get; set; }

    public int? DefaultRoomId { get; set; }

    public Organization Organization { get; set; } = null!;

    public Teacher? HomeroomTeacher { get; set; }

    public Room? DefaultRoom { get; set; }
}