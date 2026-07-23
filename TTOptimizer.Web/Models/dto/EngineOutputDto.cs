namespace TTOptimizer.Web.Models.Dto;
public class EngineOutputDto
{
    public bool Success { get; set; }

    public double InitialPenalty { get; set; }

    public double BestPenalty { get; set; }

    public List<EngineScheduledLessonDto> ScheduledLessons { get; set; } = new();

    public string? Error { get; set; }

    required public OptimizationInfo OptimizationInfo { get; set; }
}

public class OptimizationInfo
{
    public int iterations { get; set; }
    public int randomSeed { get; set; }
    public int threadCount { get; set; }
    public  long durationMilliseconds { get; set; }
    required public string Message { get; set; }
};

public class EngineScheduledLessonDto
{
    public int LessonInstanceId { get; set; }

    public int RequirementId { get; set; }

    public int ClassGroupId { get; set; }

    public int SubjectId { get; set; }

    public int TeacherId { get; set; }

    public int RoomId { get; set; }

    public string Day { get; set; } = string.Empty;

    public int LessonNumber { get; set; }
}


public class ScheduledLessonViewDto
{
    public int LessonInstanceId { get; set; }

    public int RequirementId { get; set; }

    public string ClassGroup { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Teacher { get; set; } = string.Empty;

    public string Room { get; set; } = string.Empty;

    public string Day { get; set; } = string.Empty;

    public int LessonNumber { get; set; }
}