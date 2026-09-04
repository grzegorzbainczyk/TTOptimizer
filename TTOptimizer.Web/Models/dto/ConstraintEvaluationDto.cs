namespace TTOptimizer.Web.Models.DTO;

/// <summary>
/// Summarizes one constraint evaluated for the final timetable.
/// </summary>
public class ConstraintRuleResultDto
{
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Kind { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string PenaltyLevel { get; set; } = string.Empty;

    public int ViolationCount { get; set; }

    public double Penalty { get; set; }

    public List<ConstraintViolationDto> Violations { get; set; } = new();
}

/// <summary>
/// Describes one concrete hard or soft constraint violation.
/// Zero identifiers and negative day/slot values mean "not applicable".
/// </summary>
public class ConstraintViolationDto
{
    public string Type { get; set; } = string.Empty;

    public int TeacherId { get; set; }

    public int ClassGroupId { get; set; }

    public int StudentGroupId { get; set; }

    public int OtherStudentGroupId { get; set; }

    public int RoomId { get; set; }

    public int SubjectId { get; set; }

    public int DayIndex { get; set; } = -1;

    public int SlotIndex { get; set; } = -1;

    public int OccurrenceCount { get; set; } = 1;

    public string Message { get; set; } = string.Empty;
}
