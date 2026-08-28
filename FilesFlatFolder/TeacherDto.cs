namespace TTOptimizer.Web.Models.DTO.Teachers;

public class TeacherDto
{
    public int Id { get; set; }

    public int TeacherNumber { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Alias { get; set; } = string.Empty;

    public string? Info { get; set; }
}
