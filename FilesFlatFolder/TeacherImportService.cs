using ClosedXML.Excel;
using TTOptimizer.Web.Models.DTO.Teachers;

namespace TTOptimizer.Web.Services;

public static class TeacherImportService
{
    public static TeacherImportPreviewDto ReadPreview(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);

        var worksheet = workbook.Worksheet(1);

        var result = new TeacherImportPreviewDto
        {
            Success = true
        };

        var usedRows = worksheet.RowsUsed().ToList();

        if (usedRows.Count == 0)
        {
            result.Success = false;
            result.Message = "The worksheet is empty.";
            return result;
        }

        var header = usedRows[0].Cell(1).GetString().Trim();

        if (!string.Equals(
            header,
            "Name",
            StringComparison.OrdinalIgnoreCase))
        {
            result.Success = false;
            result.Message =
                "The first column must have the header 'Name'.";

            return result;
        }

        var namesInFile = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        foreach (var row in usedRows.Skip(1))
        {
            var name = row.Cell(1).GetString().Trim();

            var item = new TeacherImportRowDto
            {
                RowNumber = row.RowNumber(),
                Name = name
            };

            if (string.IsNullOrWhiteSpace(name))
            {
                item.IsValid = false;
                item.Message = "Teacher name is empty.";
            }
            else if (!namesInFile.Add(name))
            {
                item.IsValid = false;
                item.Message = "Duplicate teacher name in the file.";
            }
            else
            {
                item.IsValid = true;
            }

            result.Rows.Add(item);
        }

        if (result.Rows.Count == 0)
        {
            result.Success = false;
            result.Message =
                "The worksheet does not contain any teacher rows.";
        }

        return result;
    }
}
