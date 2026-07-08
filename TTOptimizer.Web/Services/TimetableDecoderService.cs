using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Services;

public class TimetableDecoderService
{
    public List<ScheduledLessonView> Decode(
        EngineOptimizationResult engineResult,
        TimetableProblem problem,
        List<ScheduleSlot> scheduleSlots,
        List<LessonInstance> lessonInstances)
    {
        var scheduledLessons = new List<ScheduledLessonView>();

        for (int slotIndex = 0; slotIndex < engineResult.Genes.Count; slotIndex++)
        {
            int? lessonInstanceIndex = engineResult.Genes[slotIndex];

            if (lessonInstanceIndex is null)
            {
                continue;
            }

            if (slotIndex >= scheduleSlots.Count)
            {
                throw new InvalidOperationException(
                    $"Invalid slot index: {slotIndex}.");
            }

            if (lessonInstanceIndex.Value < 0 ||
                lessonInstanceIndex.Value >= lessonInstances.Count)
            {
                throw new InvalidOperationException(
                    $"Invalid lesson instance index: {lessonInstanceIndex.Value}.");
            }

            ScheduleSlot scheduleSlot = scheduleSlots[slotIndex];
            LessonInstance lessonInstance = lessonInstances[lessonInstanceIndex.Value];

            LessonRequirement requirement = problem.LessonRequirements
                .First(x => x.Id == lessonInstance.RequirementId);

            ClassGroup classGroup = problem.ClassGroups
                .First(x => x.Id == requirement.ClassGroupId);

            Subject subject = problem.Subjects
                .First(x => x.Id == requirement.SubjectId);

            Teacher? teacher = problem.Teachers
                .FirstOrDefault(x => x.Id == requirement.TeacherId);

            if (teacher == null)
            {
                throw new InvalidOperationException(
                    $"Teacher not found. RequirementId={requirement.Id}, TeacherId={requirement.TeacherId}");
            }

            Room room = problem.Rooms
                .First(x => x.Id == scheduleSlot.RoomId);

            scheduledLessons.Add(new ScheduledLessonView
            {
                LessonInstanceId = lessonInstance.Id,
                ClassGroup = classGroup.Name,
                Subject = subject.Name,
                Teacher = teacher.Name,
                Room = room.Name,
                Day = scheduleSlot.TimeSlot.Day.ToString(),
                LessonNumber = scheduleSlot.TimeSlot.LessonNumber
            });
        }

        return scheduledLessons
            .OrderBy(x => DayOrder(x.Day))
            .ThenBy(x => x.LessonNumber)
            .ThenBy(x => x.Room)
            .ToList();
    }

    private static int DayOrder(string day)
    {
        return day switch
        {
            "Monday" => 1,
            "Tuesday" => 2,
            "Wednesday" => 3,
            "Thursday" => 4,
            "Friday" => 5,
            _ => 99
        };
    }
}