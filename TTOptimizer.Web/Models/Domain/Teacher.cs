using TTOptimizer.Web.Models.Domain;

public class Teacher
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public int TeacherNumber { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Alias { get; set; } = string.Empty;

    public string? Info { get; set; }

    public Organization Organization { get; set; } = null!;

    public ICollection<TeacherSubject> Subjects { get; set; }
        = new List<TeacherSubject>();

    public ICollection<TeacherAssignment> Assignments { get; set; }
        = new List<TeacherAssignment>();
}
