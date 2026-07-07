public class LessonRequirement
{
    public int Id { get; set; }

    public int ClassGroupId { get; set; }
    public ClassGroup ClassGroup { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;

    public int HoursPerWeek { get; set; }
}