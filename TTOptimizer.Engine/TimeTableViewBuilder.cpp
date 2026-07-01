#include "TimetableViewBuilder.h"

#include <algorithm>
#include <stdexcept>

namespace
{
    const ClassGroup& FindClassGroupById(
        const TimetableProblem& problem,
        ClassGroupId classGroupId)
    {
        auto iterator = std::find_if(
            problem.classGroups.begin(),
            problem.classGroups.end(),
            [classGroupId](const ClassGroup& classGroup)
            {
                return classGroup.id == classGroupId;
            });

        if (iterator == problem.classGroups.end())
        {
            throw std::runtime_error("Class group not found.");
        }

        return *iterator;
    }

    const Subject& FindSubjectById(
        const TimetableProblem& problem,
        SubjectId subjectId)
    {
        auto iterator = std::find_if(
            problem.subjects.begin(),
            problem.subjects.end(),
            [subjectId](const Subject& subject)
            {
                return subject.id == subjectId;
            });

        if (iterator == problem.subjects.end())
        {
            throw std::runtime_error("Subject not found.");
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
}

std::vector<ScheduledLessonView> TimetableViewBuilder::build(
    const std::vector<ScheduledLesson>& scheduledLessons,
    const TimetableProblem& problem) const
{
    std::vector<ScheduledLessonView> result;
    result.reserve(scheduledLessons.size());

    for (const ScheduledLesson& scheduledLesson : scheduledLessons)
    {
        const ClassGroup& classGroup =
            FindClassGroupById(problem, scheduledLesson.classGroupId);

        const Subject& subject =
            FindSubjectById(problem, scheduledLesson.subjectId);

        const Teacher& teacher =
            FindTeacherById(problem, scheduledLesson.teacherId);

        const Room& room =
            FindRoomById(problem, scheduledLesson.roomId);

        ScheduledLessonView view;
        view.lessonInstanceId = scheduledLesson.lessonInstanceId;
        view.classGroupName = classGroup.name;
        view.subjectName = subject.name;
        view.teacherName = teacher.name;
        view.roomName = room.name;
        view.day = scheduledLesson.timeSlot.day;
        view.lessonNumber = scheduledLesson.timeSlot.lessonNumber;

        result.push_back(view);
    }

    return result;
}