namespace TTOptimizer.Web.Models.DTO.AI;

public class RuleInterpretationResultDto
{
    public bool Success { get; set; }

    public string? RuleType { get; set; }

    public string? TeacherName { get; set; }

    public string? ClassName { get; set; }

    public string? SubjectName { get; set; }

    public string? RoomName { get; set; }

    public string? Day { get; set; }

    public int? FromSlot { get; set; }

    public int? ToSlot { get; set; }

    public string? Message { get; set; }
}