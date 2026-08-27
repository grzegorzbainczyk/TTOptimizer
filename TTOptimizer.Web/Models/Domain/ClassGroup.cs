using TTOptimizer.Web.Models.Domain;

public class ClassGroup
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public int SchoolUnitId { get; set; }

    public string Name { get; set; } = string.Empty;

    // Nullable only for compatibility with existing/imported legacy rows.
    // New and edited classes should always have Grade defined.
    public int? Grade { get; set; }

    public string? Info { get; set; }

    public int? HomeroomTeacherId { get; set; }

    public int? DefaultRoomId { get; set; }

    public Organization Organization { get; set; } = null!;

    public SchoolUnit SchoolUnit { get; set; } = null!;

    public Teacher? HomeroomTeacher { get; set; }

    public Room? DefaultRoom { get; set; }

    public List<StudentGroup> StudentGroups { get; set; } = new();
}