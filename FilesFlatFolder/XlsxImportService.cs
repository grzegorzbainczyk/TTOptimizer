using ClosedXML.Excel;
using TTOptimizer.Web.Models.DTO.Import;

namespace TTOptimizer.Web.Services;

public static class XlsxImportService
{
    public static ImportPreviewDto ReadSingleNameColumnPreview(
        Stream stream,
        string expectedHeader = "Name",
        int maxNameLength = 200)
    {
        using var workbook = new XLWorkbook(stream);

        var worksheet = workbook.Worksheet(1);

        var result = new ImportPreviewDto
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

        // Lists imported by ClassFlow do not require a header row.
        // Keep expectedHeader in the method signature for compatibility
        // with existing controller calls, but treat every used row as data.
        var namesInFile = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        foreach (var row in usedRows)
        {
            var name = row.Cell(1).GetString().Trim();

            var item = new ImportRowDto
            {
                RowNumber = row.RowNumber(),
                Name = name
            };

            if (string.IsNullOrWhiteSpace(name))
            {
                item.IsValid = false;
                item.Message = "Name is empty.";
            }
            else if (name.Length > maxNameLength)
            {
                item.IsValid = false;
                item.Message =
                    $"Name cannot contain more than {maxNameLength} characters.";
            }
            else if (!namesInFile.Add(name))
            {
                item.IsValid = false;
                item.Message = "Duplicate name in the file.";
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
                "The worksheet does not contain any data rows.";
        }

        return result;
    }
}
