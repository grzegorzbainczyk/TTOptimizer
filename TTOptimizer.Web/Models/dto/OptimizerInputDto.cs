using TTOptimizer.Web.Models.Optimization;

namespace TTOptimizer.Web.Models.Dto;

public class OptimizerInputDto
{
    public int DaysPerWeek { get; set; }

    public int SlotsPerDay { get; set; }

    public List<OptimizerTeacherDto> Teachers { get; set; } = new();

    public List<OptimizerClassGroupDto> Classes { get; set; } = new();

    public List<OptimizerSubjectDto> Subjects { get; set; } = new();

    public List<OptimizerRoomDto> Rooms { get; set; } = new();

    public List<OptimizerLessonRequirementDto> LessonRequirements { get; set; } = new();

    public required OptimizationSettings OptimizationSettings { get; set; }
}

public class OptimizerTeacherDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}

public class OptimizerClassGroupDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}

public class OptimizerSubjectDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}

public class OptimizerRoomDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Capacity { get; set; }
}

public class OptimizerLessonRequirementDto
{
    public int Id { get; set; }

    public int TeacherId { get; set; }

    public int ClassGroupId { get; set; }

    public int SubjectId { get; set; }

    public int LessonsPerWeek { get; set; }
}
