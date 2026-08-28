namespace TTOptimizer.Web.Models.Domain;

public enum StudentGroupType
{
    WholeClass = 0,
    Subgroup = 1,
    Combined = 2,
    Individual = 3
}

public class StudentGroup
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public StudentGroupType Type { get; set; }

    // Set for WholeClass, Subgroup and Individual. Null for Combined groups.
    public int? ClassGroupId { get; set; }

    // Set for Subgroup entries created as part of a class division.
    public int? DivisionId { get; set; }

    public Organization Organization { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
    public StudentGroupDivision? Division { get; set; }

    public List<StudentGroupMember> Members { get; set; } = new();
    public List<StudentGroupMember> MemberOf { get; set; } = new();
}
