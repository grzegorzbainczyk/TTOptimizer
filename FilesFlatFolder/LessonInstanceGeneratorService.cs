using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Services;

public class LessonInstanceGeneratorService
{
    public List<LessonInstance> Generate(TimetableProblem problem)
    {
        var lessonInstances = new List<LessonInstance>();

        int nextId = 1;

        foreach (var requirement in problem.LessonRequirements)
        {
            for (int i = 0; i < requirement.HoursPerWeek; i++)
            {
                lessonInstances.Add(new LessonInstance
                {
                    Id = nextId,
                    RequirementId = requirement.Id
                });

                nextId++;
            }
        }

        return lessonInstances;
    }
}