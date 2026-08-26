using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.StudentGroups;

public class StudentGroupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public StudentGroupType Type { get; set; }
    public int? ClassGroupId { get; set; }
    public string? ClassGroupName { get; set; }
    public int? DivisionId { get; set; }
    public string? DivisionName { get; set; }
    public List<int> MemberGroupIds { get; set; } = new();
    public List<string> MemberGroupNames { get; set; } = new();
}

public class StudentGroupDivisionDto
{
    public int Id { get; set; }
    public int ClassGroupId { get; set; }
    public string ClassGroupName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<StudentGroupDto> Groups { get; set; } = new();
}

public class StudentGroupsOverviewDto
{
    public List<StudentGroupDto> Groups { get; set; } = new();
    public List<StudentGroupDivisionDto> Divisions { get; set; } = new();
}
