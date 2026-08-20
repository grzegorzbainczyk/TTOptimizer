namespace TTOptimizer.Web.Models.DTO.Teachers;

public class TeacherImportRowDto
{
    public int RowNumber { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsValid { get; set; }

    public string? Message { get; set; }
}
