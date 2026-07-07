public class ScheduledLesson
{
    public int Id { get; set; }

    public int OptimizationRunId { get; set; }
    public OptimizationRun OptimizationRun { get; set; } = null!;

    public int Day { get; set; }

    public int LessonNumber { get; set; }

    public int ClassGroupId { get; set; }
    public ClassGroup ClassGroup { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;

    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
}