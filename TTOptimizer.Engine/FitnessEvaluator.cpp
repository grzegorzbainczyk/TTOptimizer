#include <algorithm>
#include <map>
#include <stdexcept>
#include <utility>
#include <vector>
#include "FitnessEvaluator.h"


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

    const Teacher& FindTeacherById(
        const TimetableProblem& problem,
        TeacherId teacherId)
    {
        auto iterator = std::find_if(
            problem.teachers.begin(),
            problem.teachers.end(),
            [teacherId](const Teacher& teacher)
            {
                return teacher.id == teacherId;
            });

        if (iterator == problem.teachers.end())
        {
            throw std::runtime_error("Teacher not found.");
        }

        return *iterator;
    }

    const Room& FindRoomById(
        const TimetableProblem& problem,
        RoomId roomId)
    {
        auto iterator = std::find_if(
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

    bool IsSameTimeSlot(const TimeSlot& first, const TimeSlot& second)
    {
        return first.day == second.day
            && first.lessonNumber == second.lessonNumber;
    }

    bool ContainsTimeSlot(
        const std::vector<TimeSlot>& timeSlots,
        const TimeSlot& searchedTimeSlot)
    {
        return std::any_of(
            timeSlots.begin(),
            timeSlots.end(),
            [&searchedTimeSlot](const TimeSlot& timeSlot)
            {
                return IsSameTimeSlot(timeSlot, searchedTimeSlot);
            });
    }

    bool ContainsSubject(
        const std::vector<SubjectId>& subjects,
        SubjectId subjectId)
    {
        return std::find(subjects.begin(), subjects.end(), subjectId) != subjects.end();
    }
}

double FitnessEvaluator::evaluate(
    const Chromosome& chromosome,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    double penalty = 0.0;

    if (chromosome.genes.size() != scheduleSlots.size())
    {
        return 1'000'000.0;
    }

    // Counts how many times each lesson instance appears in chromosome.
    std::vector<int> lessonUsageCount(lessonInstances.size(), 0);

    // Key: teacher + time slot.
    std::map<std::pair<TeacherId, std::pair<int, int>>, int> teacherTimeUsage;

    // Key: class group + time slot.
    std::map<std::pair<ClassGroupId, std::pair<int, int>>, int> classTimeUsage;

    for (ScheduleSlotIndex slotIndex = 0; slotIndex < chromosome.genes.size(); ++slotIndex)
    {
        const std::optional<LessonInstanceIndex>& gene = chromosome.genes[slotIndex];

        if (!gene.has_value())
        {
            continue;
        }

        LessonInstanceIndex lessonIndex = gene.value();

        if (lessonIndex >= lessonInstances.size())
        {
            penalty += 100'000.0;
            continue;
        }

        lessonUsageCount[lessonIndex]++;

        const LessonInstance& lessonInstance = lessonInstances[lessonIndex];
        const LessonRequirement& requirement =
            FindRequirementById(problem, lessonInstance.requirementId);

        const ScheduleSlot& scheduleSlot = scheduleSlots[slotIndex];
        const Teacher& teacher = FindTeacherById(problem, requirement.teacherId);
        const Room& room = FindRoomById(problem, scheduleSlot.roomId);

        const int day = static_cast<int>(scheduleSlot.timeSlot.day);
        const int lessonNumber = scheduleSlot.timeSlot.lessonNumber;

        const auto timeKey = std::make_pair(day, lessonNumber);

        const auto teacherTimeKey =
            std::make_pair(requirement.teacherId, timeKey);

        const auto classTimeKey =
            std::make_pair(requirement.classGroupId, timeKey);

        teacherTimeUsage[teacherTimeKey]++;
        classTimeUsage[classTimeKey]++;

        // Teacher unavailable slot.
        if (ContainsTimeSlot(teacher.unavailableSlots, scheduleSlot.timeSlot))
        {
            penalty += 500.0;
        }

        // Subject not allowed in this room.
        if (!ContainsSubject(room.allowedSubjects, requirement.subjectId))
        {
            penalty += 300.0;
        }
    }

    // Teacher conflicts.
    for (const auto& item : teacherTimeUsage)
    {
        int usageCount = item.second;

        if (usageCount > 1)
        {
            penalty += 1000.0 * static_cast<double>(usageCount - 1);
        }
    }

    // Class group conflicts.
    for (const auto& item : classTimeUsage)
    {
        int usageCount = item.second;

        if (usageCount > 1)
        {
            penalty += 1000.0 * static_cast<double>(usageCount - 1);
        }
    }

    return penalty;
}