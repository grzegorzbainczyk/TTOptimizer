namespace TTOptimizer.Web.Models.DTO.ClassGroups;

public class CreateClassGroupRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public int? HomeroomTeacherId { get; set; }

    public int? DefaultRoomId { get; set; }
}