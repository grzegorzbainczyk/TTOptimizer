namespace TTOptimizer.Web.Models.DTO.ClassGroups;

public class ClassGroupDTO
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Info { get; set; }

    public int? HomeroomTeacherId { get; set; }

    public string? HomeroomTeacherName { get; set; }

    public int? DefaultRoomId { get; set; }

    public string? DefaultRoomName { get; set; }
}