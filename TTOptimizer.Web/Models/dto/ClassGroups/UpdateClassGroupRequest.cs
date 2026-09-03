namespace TTOptimizer.Web.Models.DTO.ClassGroups;

public class UpdateClassGroupRequest
{
    public int SchoolUnitId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Grade { get; set; }

    public bool IsEarlyEducation { get; set; }

    public string? Info { get; set; }

    public int? HomeroomTeacherId { get; set; }

    public int? DefaultRoomId { get; set; }
}
