namespace TTOptimizer.Web.Models.DTO.Subjects;

public class UpdateSubjectRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }
}