#pragma once

#include <set>
#include <string>
#include <utility>
#include <vector>

#include "Domain/TimetableProblem.h"
#include "Preprocessing/PreprocessingModels.h"

class AvailabilityValidator
{
public:
    static std::vector<PreprocessingIssue> validate(
        const TimetableProblem& problem)
    {
        std::vector<PreprocessingIssue> issues;

        if (problem.daysPerWeek <= 0 ||
            problem.daysPerWeek > 7 ||
            problem.slotsPerDay <= 0)
        {
            return issues;
        }

        validateTeacherAvailability(problem, issues);
        validateClassGroupAvailability(problem, issues);
        validateSubjectAvailability(problem, issues);
        validateTotalRoomAvailability(problem, issues);

        return issues;
    }

private:
    using TimePeriod = std::pair<int, int>;

    static bool isUnavailable(
        TimeSlotPreferenceType preferenceType)
    {
        return preferenceType ==
            TimeSlotPreferenceType::Unavailable;
    }

    static void validateTeacherAvailability(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        const int totalTimePeriodCount =
            getTotalTimePeriodCount(problem);

        for (const Teacher& teacher : problem.teachers)
        {
            const int requiredLessonCount =
                getRequiredLessonCountForTeacher(
                    problem,
                    teacher.id);

            if (requiredLessonCount == 0)
            {
                continue;
            }

            const int unavailableTimePeriodCount =
                getTeacherUnavailableTimePeriodCount(
                    problem,
                    teacher.id);

            const int availableTimePeriodCount =
                totalTimePeriodCount -
                unavailableTimePeriodCount;

            if (requiredLessonCount <=
                availableTimePeriodCount)
            {
                continue;
            }

            PreprocessingIssue issue;
            issue.severity =
                PreprocessingIssueSeverity::Error;
            issue.code =
                PreprocessingIssueCode::
                TeacherInsufficientAvailability;
            issue.teacherId = teacher.id;
            issue.requiredCount = requiredLessonCount;
            issue.availableCount = availableTimePeriodCount;

            issue.message =
                "Teacher "
                + teacher.name
                + " (ID "
                + std::to_string(teacher.id)
                + ") requires "
                + std::to_string(requiredLessonCount)
                + " weekly lessons, but has only "
                + std::to_string(availableTimePeriodCount)
                + " available time periods.";

            issues.push_back(std::move(issue));
        }
    }

    static void validateClassGroupAvailability(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        const int totalTimePeriodCount =
            getTotalTimePeriodCount(problem);

        for (const ClassGroup& classGroup :
            problem.classGroups)
        {
            const int requiredLessonCount =
                getRequiredLessonCountForClassGroup(
                    problem,
                    classGroup.id);

            if (requiredLessonCount == 0)
            {
                continue;
            }

            const int unavailableTimePeriodCount =
                getClassGroupUnavailableTimePeriodCount(
                    problem,
                    classGroup.id);

            const int availableTimePeriodCount =
                totalTimePeriodCount -
                unavailableTimePeriodCount;

            if (requiredLessonCount <=
                availableTimePeriodCount)
            {
                continue;
            }

            PreprocessingIssue issue;
            issue.severity =
                PreprocessingIssueSeverity::Error;
            issue.code =
                PreprocessingIssueCode::
                ClassGroupInsufficientAvailability;
            issue.classGroupId = classGroup.id;
            issue.requiredCount = requiredLessonCount;
            issue.availableCount = availableTimePeriodCount;

            issue.message =
                "Class group "
                + classGroup.name
                + " (ID "
                + std::to_string(classGroup.id)
                + ") requires "
                + std::to_string(requiredLessonCount)
                + " weekly lessons, but has only "
                + std::to_string(availableTimePeriodCount)
                + " available time periods.";

            issues.push_back(std::move(issue));
        }
    }

    static void validateSubjectAvailability(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        const int totalTimePeriodCount =
            getTotalTimePeriodCount(problem);

        for (const Subject& subject : problem.subjects)
        {
            const int requiredLessonCount =
                getRequiredLessonCountForSubject(
                    problem,
                    subject.id);

            if (requiredLessonCount == 0)
            {
                continue;
            }

            const int unavailableTimePeriodCount =
                getSubjectUnavailableTimePeriodCount(
                    problem,
                    subject.id);

            const int availableTimePeriodCount =
                totalTimePeriodCount -
                unavailableTimePeriodCount;

            if (requiredLessonCount <=
                availableTimePeriodCount)
            {
                continue;
            }

            PreprocessingIssue issue;
            issue.severity =
                PreprocessingIssueSeverity::Error;
            issue.code =
                PreprocessingIssueCode::
                SubjectInsufficientAvailability;
            issue.subjectId = subject.id;
            issue.requiredCount = requiredLessonCount;
            issue.availableCount = availableTimePeriodCount;

            issue.message =
                "Subject "
                + subject.name
                + " (ID "
                + std::to_string(subject.id)
                + ") requires "
                + std::to_string(requiredLessonCount)
                + " weekly lessons, but has only "
                + std::to_string(availableTimePeriodCount)
                + " available time periods.";

            issues.push_back(std::move(issue));
        }
    }

    static void validateTotalRoomAvailability(
        const TimetableProblem& problem,
        std::vector<PreprocessingIssue>& issues)
    {
        const int requiredLessonCount =
            getTotalRequiredLessonCount(problem);

        if (requiredLessonCount == 0)
        {
            return;
        }

        int availableRoomSlotCount = 0;

        const int totalTimePeriodCount =
            getTotalTimePeriodCount(problem);

        for (const Room& room : problem.rooms)
        {
            const int unavailableTimePeriodCount =
                getRoomUnavailableTimePeriodCount(
                    problem,
                    room.id);

            availableRoomSlotCount +=
                totalTimePeriodCount -
                unavailableTimePeriodCount;
        }

        if (requiredLessonCount <=
            availableRoomSlotCount)
        {
            return;
        }

        PreprocessingIssue issue;
        issue.severity =
            PreprocessingIssueSeverity::Error;
        issue.code =
            PreprocessingIssueCode::
                InsufficientRoomAvailability;
        issue.requiredCount = requiredLessonCount;
        issue.availableCount = availableRoomSlotCount;

        issue.message =
            "The timetable requires "
            + std::to_string(requiredLessonCount)
            + " lesson assignments, but only "
            + std::to_string(availableRoomSlotCount)
            + " room schedule slots are available.";

        issues.push_back(std::move(issue));
    }

    static int getTotalTimePeriodCount(
        const TimetableProblem& problem)
    {
        return problem.daysPerWeek *
            problem.slotsPerDay;
    }

    static int getTotalRequiredLessonCount(
        const TimetableProblem& problem)
    {
        int requiredLessonCount = 0;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            if (requirement.weeklyCount > 0)
            {
                requiredLessonCount +=
                    requirement.weeklyCount;
            }
        }

        return requiredLessonCount;
    }

    static int getRequiredLessonCountForTeacher(
        const TimetableProblem& problem,
        TeacherId teacherId)
    {
        int requiredLessonCount = 0;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            if (requirement.teacherId == teacherId &&
                requirement.weeklyCount > 0)
            {
                requiredLessonCount +=
                    requirement.weeklyCount;
            }
        }

        return requiredLessonCount;
    }

    static int getRequiredLessonCountForClassGroup(
        const TimetableProblem& problem,
        ClassGroupId classGroupId)
    {
        int requiredLessonCount = 0;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            if (requirement.classGroupId ==
                classGroupId &&
                requirement.weeklyCount > 0)
            {
                requiredLessonCount +=
                    requirement.weeklyCount;
            }
        }

        return requiredLessonCount;
    }

    static int getRequiredLessonCountForSubject(
        const TimetableProblem& problem,
        SubjectId subjectId)
    {
        int requiredLessonCount = 0;

        for (const LessonRequirement& requirement :
            problem.lessonRequirements)
        {
            if (requirement.subjectId == subjectId &&
                requirement.weeklyCount > 0)
            {
                requiredLessonCount +=
                    requirement.weeklyCount;
            }
        }

        return requiredLessonCount;
    }

    static int getTeacherUnavailableTimePeriodCount(
        const TimetableProblem& problem,
        TeacherId teacherId)
    {
        std::set<TimePeriod> unavailableTimePeriods;

        for (const TeacherTimeSlotPreference& preference :
            problem.teacherTimeSlotPreferences)
        {
            if (preference.teacherId != teacherId ||
                !isUnavailable(preference.preferenceType))
            {
                continue;
            }

            if (!isTimePeriodValid(
                problem,
                preference.dayIndex,
                preference.slotIndex))
            {
                continue;
            }

            unavailableTimePeriods.emplace(
                preference.dayIndex,
                preference.slotIndex);
        }

        return static_cast<int>(
            unavailableTimePeriods.size());
    }

    static int getClassGroupUnavailableTimePeriodCount(
        const TimetableProblem& problem,
        ClassGroupId classGroupId)
    {
        std::set<TimePeriod> unavailableTimePeriods;

        for (const ClassGroupTimeSlotPreference& preference :
            problem.classGroupTimeSlotPreferences)
        {
            if (preference.classGroupId != classGroupId ||
                !isUnavailable(preference.preferenceType))
            {
                continue;
            }

            if (!isTimePeriodValid(
                problem,
                preference.dayIndex,
                preference.slotIndex))
            {
                continue;
            }

            unavailableTimePeriods.emplace(
                preference.dayIndex,
                preference.slotIndex);
        }

        return static_cast<int>(
            unavailableTimePeriods.size());
    }

    static int getRoomUnavailableTimePeriodCount(
        const TimetableProblem& problem,
        RoomId roomId)
    {
        std::set<TimePeriod> unavailableTimePeriods;

        for (const RoomTimeSlotPreference& preference :
            problem.roomTimeSlotPreferences)
        {
            if (preference.roomId != roomId ||
                !isUnavailable(preference.preferenceType))
            {
                continue;
            }

            if (!isTimePeriodValid(
                problem,
                preference.dayIndex,
                preference.slotIndex))
            {
                continue;
            }

            unavailableTimePeriods.emplace(
                preference.dayIndex,
                preference.slotIndex);
        }

        return static_cast<int>(
            unavailableTimePeriods.size());
    }

    static int getSubjectUnavailableTimePeriodCount(
        const TimetableProblem& problem,
        SubjectId subjectId)
    {
        std::set<TimePeriod> unavailableTimePeriods;

        for (const SubjectTimeSlotPreference& preference :
            problem.subjectTimeSlotPreferences)
        {
            if (preference.subjectId != subjectId ||
                !isUnavailable(preference.preferenceType))
            {
                continue;
            }

            if (!isTimePeriodValid(
                problem,
                preference.dayIndex,
                preference.slotIndex))
            {
                continue;
            }

            unavailableTimePeriods.emplace(
                preference.dayIndex,
                preference.slotIndex);
        }

        return static_cast<int>(
            unavailableTimePeriods.size());
    }

    static bool isTimePeriodValid(
        const TimetableProblem& problem,
        int dayIndex,
        int slotIndex)
    {
        return dayIndex >= 0
            && dayIndex < problem.daysPerWeek
            && slotIndex >= 0
            && slotIndex < problem.slotsPerDay;
    }
};
