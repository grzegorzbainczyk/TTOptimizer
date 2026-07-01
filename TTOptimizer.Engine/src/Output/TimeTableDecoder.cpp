#include "Output/TimetableDecoder.h"

#include <algorithm>
#include <stdexcept>

namespace
{
    const LessonRequirement& FindRequirementById(
        const TimetableProblem& problem,
        LessonRequirementId requirementId)
    {
        auto iterator = std::find_if(
            problem.lessonRequirements.begin(),
            problem.lessonRequirements.end(),
            [requirementId](const LessonRequirement& requirement)
            {
                return requirement.id == requirementId;
            });

        if (iterator == problem.lessonRequirements.end())
        {
            throw std::runtime_error("Lesson requirement not found.");
        }

        return *iterator;
    }
}

std::vector<ScheduledLesson> TimetableDecoder::decode(
    const Chromosome& chromosome,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    if (chromosome.genes.size() != scheduleSlots.size())
    {
        throw std::runtime_error(
            "Cannot decode chromosome: genes size must be equal to schedule slots size.");
    }

    std::vector<ScheduledLesson> scheduledLessons;
    scheduledLessons.reserve(lessonInstances.size());

    for (ScheduleSlotIndex slotIndex = 0;
        slotIndex < chromosome.genes.size();
        ++slotIndex)
    {
        const auto& gene = chromosome.genes[slotIndex];

        if (!gene.has_value())
        {
            continue;
        }

        LessonInstanceIndex lessonIndex = gene.value();

        if (lessonIndex >= lessonInstances.size())
        {
            throw std::runtime_error(
                "Cannot decode chromosome: lesson instance index is out of range.");
        }

        const LessonInstance& lessonInstance = lessonInstances[lessonIndex];
        const LessonRequirement& requirement =
            FindRequirementById(problem, lessonInstance.requirementId);

        const ScheduleSlot& scheduleSlot = scheduleSlots[slotIndex];

        ScheduledLesson scheduledLesson;
        scheduledLesson.lessonInstanceId = lessonInstance.id;
        scheduledLesson.requirementId = requirement.id;

        scheduledLesson.classGroupId = requirement.classGroupId;
        scheduledLesson.subjectId = requirement.subjectId;
        scheduledLesson.teacherId = requirement.teacherId;
        scheduledLesson.roomId = scheduleSlot.roomId;

        scheduledLesson.timeSlot = scheduleSlot.timeSlot;

        scheduledLessons.push_back(scheduledLesson);
    }

    return scheduledLessons;
}