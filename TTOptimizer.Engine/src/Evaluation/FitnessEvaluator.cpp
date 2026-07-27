#include <algorithm>
#include <map>
#include <stdexcept>
#include <utility>
#include <vector>

#include "Evaluation/FitnessEvaluator.h"

namespace
{
    const LessonRequirement& FindRequirementById(
        const TimetableProblem& problem,
        LessonRequirementId requirementId)
    {
        const auto iterator = std::find_if(
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

    const Room& FindRoomById(
        const TimetableProblem& problem,
        RoomId roomId)
    {
        const auto iterator = std::find_if(
            problem.rooms.begin(),
            problem.rooms.end(),
            [roomId](const Room& room)
            {
                return room.id == roomId;
            });

        if (iterator == problem.rooms.end())
        {
            throw std::runtime_error("Room not found.");
        }

        return *iterator;
    }

    bool IsTeacherUnavailable(
        const TimetableProblem& problem,
        TeacherId teacherId,
        int dayIndex,
        int slotIndex)
    {
        return std::any_of(
            problem.teacherUnavailabilities.begin(),
            problem.teacherUnavailabilities.end(),
            [teacherId, dayIndex, slotIndex](
                const TeacherUnavailability& unavailability)
            {
                return unavailability.teacherId == teacherId
                    && unavailability.dayIndex == dayIndex
                    && unavailability.slotIndex == slotIndex;
            });
    }

    bool ContainsSubject(
        const std::vector<SubjectId>& subjects,
        SubjectId subjectId)
    {
        return std::find(
            subjects.begin(),
            subjects.end(),
            subjectId) != subjects.end();
    }
}

FitnessScore FitnessEvaluator::evaluate(
    const Chromosome& chromosome,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    FitnessScore score;

    if (chromosome.genes.size() != scheduleSlots.size())
    {
        score.hardViolationCount++;
        return score;
    }

    std::vector<int> lessonUsageCount(lessonInstances.size(), 0);

    std::map<std::pair<TeacherId, std::pair<int, int>>, int>
        teacherTimeUsage;

    std::map<std::pair<ClassGroupId, std::pair<int, int>>, int>
        classTimeUsage;

    for (ScheduleSlotIndex slotIndex = 0;
         slotIndex < chromosome.genes.size();
         ++slotIndex)
    {
        const std::optional<LessonInstanceIndex>& gene =
            chromosome.genes[slotIndex];

        if (!gene.has_value())
        {
            continue;
        }

        const LessonInstanceIndex lessonIndex = gene.value();

        if (lessonIndex >= lessonInstances.size())
        {
            score.hardViolationCount++;
            continue;
        }

        lessonUsageCount[lessonIndex]++;

        const LessonInstance& lessonInstance =
            lessonInstances[lessonIndex];

        const LessonRequirement& requirement =
            FindRequirementById(
                problem,
                lessonInstance.requirementId);

        const ScheduleSlot& scheduleSlot =
            scheduleSlots[slotIndex];

        const Room& room =
            FindRoomById(problem, scheduleSlot.roomId);

        const int day =
            static_cast<int>(scheduleSlot.timeSlot.day);

        const int lessonNumber =
            scheduleSlot.timeSlot.lessonNumber;

        const auto timeKey =
            std::make_pair(day, lessonNumber);

        const auto teacherTimeKey =
            std::make_pair(requirement.teacherId, timeKey);

        const auto classTimeKey =
            std::make_pair(requirement.classGroupId, timeKey);

        teacherTimeUsage[teacherTimeKey]++;
        classTimeUsage[classTimeKey]++;

        // Hard constraint: teacher unavailable.
        if (IsTeacherUnavailable(
            problem,
            requirement.teacherId,
            day,
            lessonNumber))
        {
            score.hardViolationCount++;
        }

        // Soft constraint for now:
        // subject is not preferred/allowed in the selected room.
        if (!ContainsSubject(
            room.allowedSubjects,
            requirement.subjectId))
        {
            score.softPenalty += ToPenalty(PenaltyLevel::Medium);
        }
    }

    // Hard constraint: teacher conflict.
    for (const auto& item : teacherTimeUsage)
    {
        const int usageCount = item.second;

        if (usageCount > 1)
        {
            score.hardViolationCount += usageCount - 1;
        }
    }

    // Hard constraint: class group conflict.
    for (const auto& item : classTimeUsage)
    {
        const int usageCount = item.second;

        if (usageCount > 1)
        {
            score.hardViolationCount += usageCount - 1;
        }
    }

    return score;
}
