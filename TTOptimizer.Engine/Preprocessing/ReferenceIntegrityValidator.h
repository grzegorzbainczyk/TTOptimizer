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

        validateLessonRequirements(problem, issues);
        validateTeacherTimeSlotPreferences(problem, issues);
        validateClassGroupTimeSlotPreferences(problem, issues);
        validateRoomTimeSlotPreferences(problem, issues);
        validateSubjectTimeSlotPreferences(problem, issues);

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

                issue.requirementId = requirement.id;
                issue.teacherId = requirement.teacherId;
                issue.classGroupId = requirement.classGroupId;
                issue.subjectId = requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references teacher "
                    + std::to_string(requirement.teacherId)
                    + ", but this teacher does not exist.";

                issues.push_back(std::move(issue));
            }

            // StudentGroupId is the primary scheduling target in the new model.
            // ClassGroupId is kept only for legacy / compatibility requirements.
            if (requirement.studentGroupId == 0 &&
                !classGroupExists(
                    problem,
                    requirement.classGroupId))
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::
                    ClassGroupNotFound;

                issue.requirementId = requirement.id;
                issue.teacherId = requirement.teacherId;
                issue.classGroupId = requirement.classGroupId;
                issue.subjectId = requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references class group "
                    + std::to_string(requirement.classGroupId)
                    + ", but this class group does not exist.";

                issues.push_back(std::move(issue));
            }

            if (requirement.studentGroupId != 0 &&
                !studentGroupExists(
                    problem,
                    requirement.studentGroupId))
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::
                    ClassGroupNotFound;

                issue.requirementId = requirement.id;
                issue.teacherId = requirement.teacherId;
                issue.classGroupId = requirement.classGroupId;
                issue.subjectId = requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references student group "
                    + std::to_string(requirement.studentGroupId)
                    + ", but this student group does not exist.";

                issues.push_back(std::move(issue));
            }

            if (!subjectExists(
                problem,
                requirement.subjectId))
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::SubjectNotFound;

                issue.requirementId = requirement.id;
                issue.teacherId = requirement.teacherId;
                issue.classGroupId = requirement.classGroupId;
                issue.subjectId = requirement.subjectId;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " references subject "
                    + std::to_string(requirement.subjectId)
                    + ", but this subject does not exist.";

                issues.push_back(std::move(issue));
            }
        }
    }

    static void validateTeacherTimeSlotPreferences(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const TeacherTimeSlotPreference& preference :
            problem.teacherTimeSlotPreferences)
        {
            if (teacherExists(problem, preference.teacherId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::TeacherNotFound;

            issue.teacherId = preference.teacherId;
            issue.dayIndex = preference.dayIndex;
            issue.slotIndex = preference.slotIndex;

            issue.message =
                "Teacher time slot preference references teacher "
                + std::to_string(preference.teacherId)
                + ", but this teacher does not exist.";

            issues.push_back(std::move(issue));
        }
    }

    static void validateClassGroupTimeSlotPreferences(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const ClassGroupTimeSlotPreference& preference :
            problem.classGroupTimeSlotPreferences)
        {
            if (classGroupExists(
                problem,
                preference.classGroupId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::
                ClassGroupNotFound;

            issue.classGroupId = preference.classGroupId;
            issue.dayIndex = preference.dayIndex;
            issue.slotIndex = preference.slotIndex;

            issue.message =
                "Class group time slot preference references class group "
                + std::to_string(preference.classGroupId)
                + ", but this class group does not exist.";

            issues.push_back(std::move(issue));
        }
    }

    static void validateRoomTimeSlotPreferences(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const RoomTimeSlotPreference& preference :
            problem.roomTimeSlotPreferences)
        {
            if (roomExists(problem, preference.roomId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::RoomNotFound;

            issue.roomId = preference.roomId;
            issue.dayIndex = preference.dayIndex;
            issue.slotIndex = preference.slotIndex;

            issue.message =
                "Room time slot preference references room "
                + std::to_string(preference.roomId)
                + ", but this room does not exist.";

            issues.push_back(std::move(issue));
        }
    }

    static void validateSubjectTimeSlotPreferences(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const SubjectTimeSlotPreference& preference :
            problem.subjectTimeSlotPreferences)
        {
            if (subjectExists(problem, preference.subjectId))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::SubjectNotFound;

            issue.subjectId = preference.subjectId;
            issue.dayIndex = preference.dayIndex;
            issue.slotIndex = preference.slotIndex;

            issue.message =
                "Subject time slot preference references subject "
                + std::to_string(preference.subjectId)
                + ", but this subject does not exist.";

            issues.push_back(std::move(issue));
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
            [classGroupId](const ClassGroup& classGroup)
            {
                return classGroup.id == classGroupId;
            });
    }

    static bool studentGroupExists(
        const TimetableProblem& problem,
        StudentGroupId studentGroupId)
    {
        return std::any_of(
            problem.studentGroups.begin(),
            problem.studentGroups.end(),
            [studentGroupId](const StudentGroup& studentGroup)
            {
                return studentGroup.id == studentGroupId;
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
