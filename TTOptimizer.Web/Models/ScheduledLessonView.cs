namespace TTOptimizer.Web.Models;

public class ScheduledLessonView
{
    public int LessonInstanceId { get; set; }

    public string ClassGroup { get; set; } = "";

    public string Subject { get; set; } = "";

    public string Teacher { get; set; } = "";

    public string Room { get; set; } = "";

    public string Day { get; set; } = "";

    public int LessonNumber { get; set; }
}