#include <vector>
#include "Domain/TimetableModels.h"


class LessonInstanceGenerator
{
public:

    static std::vector<LessonInstance> generate(const TimetableProblem& problem)
    {
        std::vector<LessonInstance> lessonInstances;

        int totalLessonCount = 0;

        for (const LessonRequirement& requirement : problem.lessonRequirements)
        {
            totalLessonCount += requirement.weeklyCount;
        }

        lessonInstances.reserve(static_cast<std::size_t>(totalLessonCount));

        LessonInstanceId nextId = 1;

        for (const LessonRequirement& requirement : problem.lessonRequirements)
        {
            for (int i = 0; i < requirement.weeklyCount; ++i)
            {
                LessonInstance lessonInstance;
                lessonInstance.id = nextId;
                lessonInstance.requirementId = requirement.id;

                lessonInstances.push_back(lessonInstance);

                ++nextId;
            }
        }

        return lessonInstances;
    }
};