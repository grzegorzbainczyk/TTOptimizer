namespace TTOptimizer.Web.Models.DTO.Buildings;

public class UpdateBuildingRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Info { get; set; }
}
