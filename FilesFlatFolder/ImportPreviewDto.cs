namespace TTOptimizer.Web.Models.DTO.Import;

public class ImportPreviewDto
{
    public bool Success { get; set; }

    public List<ImportRowDto> Rows { get; set; } = new();

    public string? Message { get; set; }
}
