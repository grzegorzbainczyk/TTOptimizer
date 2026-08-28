namespace TTOptimizer.Web.Models.DTO.Buildings;

public class BuildingDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Info { get; set; }
    public int RoomCount { get; set; }
}
