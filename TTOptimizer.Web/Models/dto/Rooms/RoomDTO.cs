namespace TTOptimizer.Web.Models.DTO.Rooms;

public class RoomDTO
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public int? RestrictedToSubjectId { get; set; }

    public string? RestrictedToSubjectName { get; set; }

    public int? PreferredSubjectId { get; set; }

    public string? PreferredSubjectName { get; set; }
}