#pragma once

#include <string>
#include <vector>

#include "Domain/TimetableModels.h"

enum class PreprocessingIssueSeverity
{
    Warning,
    Error
};

enum class PreprocessingIssueCode
{
    InvalidDaysPerWeek,
    InvalidSlotsPerDay,
    InvalidWeeklyCount,
    InvalidTimeSlotPreference,

    MissingTeachers,
    MissingClassGroups,
    MissingSubjects,
    MissingRooms,
    MissingLessonRequirements,

    TeacherNotFound,
    ClassGroupNotFound,
    SubjectNotFound,
    RoomNotFound,

    TeacherInsufficientAvailability,
    ClassGroupInsufficientAvailability,
    SubjectInsufficientAvailability,
    InsufficientRoomAvailability
};

struct PreprocessingIssue
{
    PreprocessingIssueSeverity severity{
        PreprocessingIssueSeverity::Error
    };

    PreprocessingIssueCode code{
        PreprocessingIssueCode::InvalidDaysPerWeek
    };

    std::string message;

    TeacherId teacherId{};
    ClassGroupId classGroupId{};
    SubjectId subjectId{};
    RoomId roomId{};
    LessonRequirementId requirementId{};

    int dayIndex{ -1 };
    int slotIndex{ -1 };

    int requiredCount{};
    int availableCount{};
};

struct PreprocessingResult
{
    bool canOptimize{};

    std::vector<PreprocessingIssue> issues;

    std::vector<LessonInstance> lessonInstances;
    std::vector<ScheduleSlot> scheduleSlots;

    bool hasErrors() const
    {
        for (const PreprocessingIssue& issue : issues)
        {
            if (issue.severity ==
                PreprocessingIssueSeverity::Error)
            {
                return true;
            }
        }

        return false;
    }

    bool hasWarnings() const
    {
        for (const PreprocessingIssue& issue : issues)
        {
            if (issue.severity ==
                PreprocessingIssueSeverity::Warning)
            {
                return true;
            }
        }

        return false;
    }
};