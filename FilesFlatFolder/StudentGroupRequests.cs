namespace TTOptimizer.Web.Models.DTO.StudentGroups;

public class CreateStudentGroupDivisionRequest
{
    public int ClassGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<string> GroupNames { get; set; } = new();
}

public class CreateCombinedStudentGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public List<int> MemberGroupIds { get; set; } = new();
}

public class CreateIndividualStudentGroupRequest
{
    public int ClassGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
}
