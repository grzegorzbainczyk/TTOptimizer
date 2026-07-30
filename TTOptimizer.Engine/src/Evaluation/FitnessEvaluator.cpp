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
            throw std::runtime_error(
                "Lesson requirement not found.");
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
            throw std::runtime_error(
                "Room not found.");
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

    bool IsClassGroupUnavailable(
        const TimetableProblem& problem,
        ClassGroupId classGroupId,
        int dayIndex,
        int slotIndex)
    {
        return std::any_of(
            problem.classGroupUnavailabilities.begin(),
            problem.classGroupUnavailabilities.end(),
            [classGroupId, dayIndex, slotIndex](
                const ClassGroupUnavailability& unavailability)
            {
                return unavailability.classGroupId == classGroupId
                    && unavailability.dayIndex == dayIndex
                    && unavailability.slotIndex == slotIndex;
            });
    }

    bool IsRoomUnavailable(
        const TimetableProblem& problem,
        RoomId roomId,
        int dayIndex,
        int slotIndex)
    {
        return std::any_of(
            problem.roomUnavailabilities.begin(),
            problem.roomUnavailabilities.end(),
            [roomId, dayIndex, slotIndex](
                const RoomUnavailability& unavailability)
            {
                return unavailability.roomId == roomId
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

    /*
     * In the current chromosome model:
     *
     * gene index = lesson instance index
     * gene value = assigned schedule slot index
     */
    if (chromosome.genes.size() != lessonInstances.size())
    {
        score.hardViolationCount++;
        return score;
    }

    /*
     * Counts how many lessons use the same physical schedule slot.
     *
     * A ScheduleSlot represents a room together with a day and lesson number.
     */
    std::map<ScheduleSlotIndex, int> scheduleSlotUsage;

    std::map<std::pair<TeacherId, std::pair<int, int>>, int>
        teacherTimeUsage;

    std::map<std::pair<ClassGroupId, std::pair<int, int>>, int>
        classTimeUsage;

    for (LessonInstanceIndex lessonIndex = 0;
        lessonIndex < chromosome.genes.size();
        ++lessonIndex)
    {
        const ScheduleSlotIndex scheduleSlotIndex =
            chromosome.genes[lessonIndex];

        if (scheduleSlotIndex >= scheduleSlots.size())
        {
            score.hardViolationCount++;
            continue;
        }

        const LessonInstance& lessonInstance =
            lessonInstances[lessonIndex];

        const LessonRequirement& requirement =
            FindRequirementById(
                problem,
                lessonInstance.requirementId);

        const ScheduleSlot& scheduleSlot =
            scheduleSlots[scheduleSlotIndex];

        const Room& room =
            FindRoomById(
                problem,
                scheduleSlot.roomId);

        const int dayIndex =
            static_cast<int>(
                scheduleSlot.timeSlot.day);

        const int slotIndex =
            scheduleSlot.timeSlot.lessonNumber;

        const auto timeKey =
            std::make_pair(
                dayIndex,
                slotIndex);

        const auto teacherTimeKey =
            std::make_pair(
                requirement.teacherId,
                timeKey);

        const auto classTimeKey =
            std::make_pair(
                requirement.classGroupId,
                timeKey);

        scheduleSlotUsage[scheduleSlotIndex]++;
        teacherTimeUsage[teacherTimeKey]++;
        classTimeUsage[classTimeKey]++;

        // Hard constraint: teacher is unavailable.
        if (IsTeacherUnavailable(
            problem,
            requirement.teacherId,
            dayIndex,
            slotIndex))
        {
            score.hardViolationCount++;
        }

        // Hard constraint: class group is unavailable.
        if (IsClassGroupUnavailable(
            problem,
            requirement.classGroupId,
            dayIndex,
            slotIndex))
        {
            score.hardViolationCount++;
        }

        // Hard constraint: room is unavailable.
        if (IsRoomUnavailable(
            problem,
            scheduleSlot.roomId,
            dayIndex,
            slotIndex))
        {
            score.hardViolationCount++;
        }

        /*
         * Soft constraint:
         * the selected room does not allow or prefer this subject.
         */
        if (!ContainsSubject(
            room.allowedSubjects,
            requirement.subjectId))
        {
            score.softPenalty +=
                ToPenalty(PenaltyLevel::Medium);
        }
    }

    // Hard constraint: multiple lessons use the same room and time.
    for (const auto& item : scheduleSlotUsage)
    {
        const int usageCount = item.second;

        if (usageCount > 1)
        {
            score.hardViolationCount +=
                usageCount - 1;
        }
    }

    // Hard constraint: teacher conflict.
    for (const auto& item : teacherTimeUsage)
    {
        const int usageCount = item.second;

        if (usageCount > 1)
        {
            score.hardViolationCount +=
                usageCount - 1;
        }
    }

    // Hard constraint: class group conflict.
    for (const auto& item : classTimeUsage)
    {
        const int usageCount = item.second;

        if (usageCount > 1)
        {
            score.hardViolationCount +=
                usageCount - 1;
        }
    }

    return score;
}