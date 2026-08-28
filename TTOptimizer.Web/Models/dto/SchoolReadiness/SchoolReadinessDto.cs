namespace TTOptimizer.Web.Models.DTO.SchoolReadiness;

public class SchoolReadinessDto
{
    public bool FoundationReady { get; set; }
    public bool CanConfigureLessons { get; set; }
    public bool CanOptimize { get; set; }
    public int CompletedSteps { get; set; }
    public int TotalSteps { get; set; }
    public SchoolReadinessCountsDto Counts { get; set; } = new();
    public List<SchoolReadinessStepDto> MissingSteps { get; set; } = new();
}

public class SchoolReadinessCountsDto
{
    public int SchoolUnits { get; set; }
    public int SchoolUnitsWithType { get; set; }
    public int Buildings { get; set; }
    public int Rooms { get; set; }
    public int Subjects { get; set; }
    public int Teachers { get; set; }
    public int Classes { get; set; }
    public int Lessons { get; set; }
}

public class SchoolReadinessStepDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string ButtonLabel { get; set; } = string.Empty;
}
