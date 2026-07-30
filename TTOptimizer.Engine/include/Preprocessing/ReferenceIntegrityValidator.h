#pragma once

#include <algorithm>
#include <string>
#include <utility>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Preprocessing/PreprocessingModels.h"

class ReferenceIntegrityValidator
{
public:
    static std::vector<PreprocessingIssue> validate(
        const TimetableProblem& problem)
    {
        std::vector<PreprocessingIssue> issues;

        validateLessonRequirements(
            problem,
            issues);

        validateTeacherUnavailabilities(
            problem,
            issues);

        validateClassGroupUnavailabilities(
            problem,
            issues);

        validateRoomUnavailabilities(
            problem,
            issues);

        return issues;
    }

private:
    static void validateLessonRequirements(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            if (!teacherExists(
                problem,
                requirement.teacherId))
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::TeacherNotFound;

                issue.requirementId =
                    requirement.id;

                issue.teacherId =
                    requirement.teacherId;

                issue.classGroupId =
                    requirement.classGroupId;

                issue.subjectId =
                    requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references teacher "
                    + std::to_string(requirement.teacherId)
                    + ", but this teacher does not exist.";

                issues.push_back(
                    std::move(issue));
            }

            if (!classGroupExists(
                problem,
                requirement.classGroupId))
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::
                    ClassGroupNotFound;

                issue.requirementId =
                    requirement.id;

                issue.teacherId =
                    requirement.teacherId;

                issue.classGroupId =
                    requirement.classGroupId;

                issue.subjectId =
                    requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references class group "
                    + std::to_string(requirement.classGroupId)
                    + ", but this class group does not exist.";

                issues.push_back(
                    std::move(issue));
            }

            if (!subjectExists(
                problem,
                requirement.subjectId))
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::SubjectNotFound;

                issue.requirementId =
                    requirement.id;

                issue.teacherId =
                    requirement.teacherId;

                issue.classGroupId =
                    requirement.classGroupId;

                issue.subjectId =
                    requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references subject "
                    + std::to_string(requirement.subjectId)
                    + ", but this subject does not exist.";

                issues.push_back(
                    std::move(issue));
            }
        }
    }

    static void validateTeacherUnavailabilities(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const TeacherUnavailability& unavailability :
            problem.teacherUnavailabilities)
        {
            if (teacherExists(
                problem,
                unavailability.teacherId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::TeacherNotFound;

            issue.teacherId =
                unavailability.teacherId;

            issue.dayIndex =
                unavailability.dayIndex;

            issue.slotIndex =
                unavailability.slotIndex;

            issue.message =
                "Teacher unavailability references teacher "
                + std::to_string(unavailability.teacherId)
                + ", but this teacher does not exist.";

            issues.push_back(
                std::move(issue));
        }
    }

    static void validateClassGroupUnavailabilities(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const ClassGroupUnavailability& unavailability :
            problem.classGroupUnavailabilities)
        {
            if (classGroupExists(
                problem,
                unavailability.classGroupId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::
                ClassGroupNotFound;

            issue.classGroupId =
                unavailability.classGroupId;

            issue.dayIndex =
                unavailability.dayIndex;

            issue.slotIndex =
                unavailability.slotIndex;

            issue.message =
                "Class group unavailability references class group "
                + std::to_string(
                    unavailability.classGroupId)
                + ", but this class group does not exist.";

            issues.push_back(
                std::move(issue));
        }
    }

    static void validateRoomUnavailabilities(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const RoomUnavailability& unavailability :
            problem.roomUnavailabilities)
        {
            if (roomExists(
                problem,
                unavailability.roomId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::RoomNotFound;

            issue.roomId =
                unavailability.roomId;

            issue.dayIndex =
                unavailability.dayIndex;

            issue.slotIndex =
                unavailability.slotIndex;

            issue.message =
                "Room unavailability references room "
                + std::to_string(unavailability.roomId)
                + ", but this room does not exist.";

            issues.push_back(
                std::move(issue));
        }
    }

    static bool teacherExists(
        const TimetableProblem& problem,
        TeacherId teacherId)
    {
        return std::any_of(
            problem.teachers.begin(),
            problem.teachers.end(),
            [teacherId](const Teacher& teacher)
            {
                return teacher.id == teacherId;
            });
    }

    static bool classGroupExists(
        const TimetableProblem& problem,
        ClassGroupId classGroupId)
    {
        return std::any_of(
            problem.classGroups.begin(),
            problem.classGroups.end(),
            [classGroupId](
                const ClassGroup& classGroup)
            {
                return classGroup.id == classGroupId;
            });
    }

    static bool subjectExists(
        const TimetableProblem& problem,
        SubjectId subjectId)
    {
        return std::any_of(
            problem.subjects.begin(),
            problem.subjects.end(),
            [subjectId](const Subject& subject)
            {
                return subject.id == subjectId;
            });
    }

    static bool roomExists(
        const TimetableProblem& problem,
        RoomId roomId)
    {
        return std::any_of(
            problem.rooms.begin(),
            problem.rooms.end(),
            [roomId](const Room& room)
            {
                return room.id == roomId;
            });
    }
};