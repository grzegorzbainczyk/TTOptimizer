#pragma once

#include <string>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Preprocessing/PreprocessingModels.h"

class StructuralProblemValidator
{
public:
    static std::vector<PreprocessingIssue> validate(
        const TimetableProblem& problem)
    {
        std::vector<PreprocessingIssue> issues;

        validateDimensions(
            problem,
            issues);

        validateRequiredCollections(
            problem,
            issues);

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
    static void validateDimensions(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        if (problem.daysPerWeek < 1 ||
            problem.daysPerWeek > 7)
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::InvalidDaysPerWeek;

            issue.message =
                "Days per week must be between 1 and 7.";

            issues.push_back(
                std::move(issue));
        }

        if (problem.slotsPerDay <= 0)
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::InvalidSlotsPerDay;

            issue.message =
                "Slots per day must be greater than zero.";

            issues.push_back(
                std::move(issue));
        }
    }

    static void validateRequiredCollections(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        if (problem.teachers.empty())
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::MissingTeachers;

            issue.message =
                "No teachers are defined.";

            issues.push_back(
                std::move(issue));
        }

        if (problem.classGroups.empty())
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::MissingClassGroups;

            issue.message =
                "No class groups are defined.";

            issues.push_back(
                std::move(issue));
        }

        if (problem.subjects.empty())
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::MissingSubjects;

            issue.message =
                "No subjects are defined.";

            issues.push_back(
                std::move(issue));
        }

        if (problem.rooms.empty())
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::MissingRooms;

            issue.message =
                "No rooms are defined.";

            issues.push_back(
                std::move(issue));
        }

        if (problem.lessonRequirements.empty())
        {
            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::
                MissingLessonRequirements;

            issue.message =
                "No lesson requirements are defined.";

            issues.push_back(
                std::move(issue));
        }
    }

    static void validateLessonRequirements(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            if (requirement.weeklyCount <= 0)
            {
                PreprocessingIssue issue;

                issue.code =
                    PreprocessingIssueCode::
                    InvalidWeeklyCount;

                issue.requirementId =
                    requirement.id;

                issue.teacherId =
                    requirement.teacherId;

                issue.classGroupId =
                    requirement.classGroupId;

                issue.subjectId =
                    requirement.subjectId;

                issue.requiredCount =
                    requirement.weeklyCount;

                issue.message =
                    "Lesson requirement "
                    + std::to_string(requirement.id)
                    + " must have a weekly count "
                    "greater than zero.";

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
            if (isTimeIndexValid(
                unavailability.dayIndex,
                unavailability.slotIndex,
                problem))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::
                InvalidUnavailability;

            issue.teacherId =
                unavailability.teacherId;

            issue.dayIndex =
                unavailability.dayIndex;

            issue.slotIndex =
                unavailability.slotIndex;

            issue.message =
                "Teacher unavailability contains "
                "an invalid day or slot index.";

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
            if (isTimeIndexValid(
                unavailability.dayIndex,
                unavailability.slotIndex,
                problem))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::
                InvalidUnavailability;

            issue.classGroupId =
                unavailability.classGroupId;

            issue.dayIndex =
                unavailability.dayIndex;

            issue.slotIndex =
                unavailability.slotIndex;

            issue.message =
                "Class group unavailability contains "
                "an invalid day or slot index.";

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
            if (isTimeIndexValid(
                unavailability.dayIndex,
                unavailability.slotIndex,
                problem))
            {
                continue;
            }

            PreprocessingIssue issue;

            issue.code =
                PreprocessingIssueCode::
                InvalidUnavailability;

            issue.roomId =
                unavailability.roomId;

            issue.dayIndex =
                unavailability.dayIndex;

            issue.slotIndex =
                unavailability.slotIndex;

            issue.message =
                "Room unavailability contains "
                "an invalid day or slot index.";

            issues.push_back(
                std::move(issue));
        }
    }

    static bool isTimeIndexValid(
        int dayIndex,
        int slotIndex,
        const TimetableProblem& problem)
    {
        return dayIndex >= 0
            && dayIndex < problem.daysPerWeek
            && slotIndex >= 0
            && slotIndex < problem.slotsPerDay;
    }
};