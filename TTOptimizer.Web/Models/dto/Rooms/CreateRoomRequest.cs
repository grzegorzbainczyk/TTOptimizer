namespace TTOptimizer.Web.Models.DTO.Rooms;

public class CreateRoomRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public int? RestrictedToSubjectId { get; set; }

    public int? PreferredSubjectId { get; set; }
}