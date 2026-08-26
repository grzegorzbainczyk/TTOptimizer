namespace TTOptimizer.Web.Models.Domain;

public class StudentGroupMember
{
    public int StudentGroupId { get; set; }
    public int MemberGroupId { get; set; }

    public StudentGroup StudentGroup { get; set; } = null!;
    public StudentGroup MemberGroup { get; set; } = null!;
}
