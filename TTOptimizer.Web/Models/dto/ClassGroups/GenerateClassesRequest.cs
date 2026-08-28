namespace TTOptimizer.Web.Models.DTO.ClassGroups;

public class GenerateClassesRequest
{
    public int SchoolUnitId { get; set; }

    public List<GenerateClassesGradeRequest> Counts { get; set; }
        = new();
}

public class GenerateClassesGradeRequest
{
    public int Grade { get; set; }

    public int Count { get; set; }
}
