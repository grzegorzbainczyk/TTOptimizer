#pragma once

#include <algorithm>
#include <stdexcept>
#include <vector>

#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"

class ChromosomeDecoder
{
public:
    static std::vector<ScheduledLesson> decode(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        /*
         * In the current chromosome model:
         *
         * gene index = lesson instance index
         * gene value = assigned schedule slot index
         */
        if (chromosome.genes.size() != lessonInstances.size())
        {
            throw std::runtime_error(
                "Cannot decode chromosome: genes size must be equal "
                "to lesson instances size.");
        }

        std::vector<ScheduledLesson> scheduledLessons;
        scheduledLessons.reserve(lessonInstances.size());

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < chromosome.genes.size();
            ++lessonIndex)
        {
            const ScheduleSlotIndex scheduleSlotIndex =
                chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= scheduleSlots.size())
            {
                throw std::runtime_error(
                    "Cannot decode chromosome: schedule slot index "
                    "is out of range.");
            }

            const LessonInstance& lessonInstance =
                lessonInstances[lessonIndex];

            const LessonRequirement& requirement =
                FindRequirementById(
                    problem,
                    lessonInstance.requirementId);

            const ScheduleSlot& scheduleSlot =
                scheduleSlots[scheduleSlotIndex];

            ScheduledLesson scheduledLesson;

            scheduledLesson.lessonInstanceId =
                lessonInstance.id;
            
            scheduledLesson.studentGroupId = requirement.studentGroupId;

            scheduledLesson.requirementId =
                requirement.id;

            scheduledLesson.classGroupId =
                requirement.classGroupId;

            scheduledLesson.subjectId =
                requirement.subjectId;

            scheduledLesson.teacherId =
                requirement.teacherId;

            scheduledLesson.roomId =
                scheduleSlot.roomId;

            scheduledLesson.timeSlot =
                scheduleSlot.timeSlot;

            scheduledLessons.push_back(
                scheduledLesson);
        }

        return scheduledLessons;
    }

private:
    static const LessonRequirement& FindRequirementById(
        const TimetableProblem& problem,
        LessonRequirementId requirementId)
    {
        const auto iterator = std::find_if(
            problem.lessonRequirements.begin(),
            problem.lessonRequirements.end(),
            [requirementId](
                const LessonRequirement& requirement)
            {
                return requirement.id ==
                    requirementId;
            });

        if (iterator == problem.lessonRequirements.end())
        {
            throw std::runtime_error(
                "Lesson requirement not found.");
        }

        return *iterator;
    }
};