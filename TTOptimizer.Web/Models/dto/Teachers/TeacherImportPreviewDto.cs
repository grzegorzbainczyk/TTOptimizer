namespace TTOptimizer.Web.Models.DTO.Teachers;

public class TeacherImportPreviewDto
{
    public bool Success { get; set; }

    public List<TeacherImportRowDto> Rows { get; set; } = new();

    public string? Message { get; set; }
}
