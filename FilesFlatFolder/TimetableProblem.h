#pragma once

#include <vector>
#include "TimetableModels.h"

enum class TimeSlotPreferenceType
{
    Preferred,
    Available,
    NotPreferred,
    Unavailable
};

enum class SchedulingPreferenceLevel
{
    Disabled,
    Low,
    Medium,
    High,
    Hard
};

struct TeacherTimeSlotPreference
{
    TeacherId teacherId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{
        TimeSlotPreferenceType::Available
    };
};

struct ClassGroupTimeSlotPreference
{
    ClassGroupId classGroupId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{
        TimeSlotPreferenceType::Available
    };
};

struct RoomTimeSlotPreference
{
    RoomId roomId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{
        TimeSlotPreferenceType::Available
    };
};

struct SubjectTimeSlotPreference
{
    SubjectId subjectId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{
        TimeSlotPreferenceType::Available
    };
};

struct TeacherSchedulingPreference
{
    TeacherId teacherId{};

    SchedulingPreferenceLevel minimizeGaps{
        SchedulingPreferenceLevel::Medium
    };

    SchedulingPreferenceLevel avoidSingleLessonDay{
        SchedulingPreferenceLevel::Low
    };

    SchedulingPreferenceLevel maxConsecutiveLessons{
        SchedulingPreferenceLevel::Medium
    };

    int maxConsecutiveLessonsLimit{ 4 };

    SchedulingPreferenceLevel maxLessonsPerDay{
        SchedulingPreferenceLevel::Medium
    };

    int maxLessonsPerDayLimit{ 6 };
};


struct ClassGroupSchedulingPreference
{
    ClassGroupId classGroupId{};

    SchedulingPreferenceLevel minimizeGaps{
        SchedulingPreferenceLevel::Medium
    };

    SchedulingPreferenceLevel avoidSingleLessonDay{
        SchedulingPreferenceLevel::Disabled
    };

    SchedulingPreferenceLevel maxConsecutiveLessons{
        SchedulingPreferenceLevel::Medium
    };

    int maxConsecutiveLessonsLimit{ 6 };

    SchedulingPreferenceLevel maxLessonsPerDay{
        SchedulingPreferenceLevel::High
    };

    int maxLessonsPerDayLimit{ 8 };
};


struct SubjectSchedulingPreference
{
    SubjectId subjectId{};

    SchedulingPreferenceLevel spreadAcrossDays{
        SchedulingPreferenceLevel::Medium
    };

    SchedulingPreferenceLevel maxOccurrencesPerDay{
        SchedulingPreferenceLevel::Medium
    };

    int maxOccurrencesPerDayLimit{ 1 };

    SchedulingPreferenceLevel preferDoubleLessons{
        SchedulingPreferenceLevel::Disabled
    };

    SchedulingPreferenceLevel avoidDoubleLessons{
        SchedulingPreferenceLevel::Disabled
    };
};

struct TimetableProblem
{
    std::vector<Teacher> teachers;
    std::vector<ClassGroup> classGroups;
    std::vector<Subject> subjects;
    std::vector<Room> rooms;
    std::vector<StudentGroup> studentGroups;
    std::vector<StudentGroupConflict> studentGroupConflicts;
    std::vector<LessonRequirement> lessonRequirements;

    std::vector<TeacherTimeSlotPreference>
        teacherTimeSlotPreferences;

    std::vector<ClassGroupTimeSlotPreference>
        classGroupTimeSlotPreferences;

    std::vector<RoomTimeSlotPreference>
        roomTimeSlotPreferences;

    std::vector<SubjectTimeSlotPreference>
        subjectTimeSlotPreferences;

    std::vector<TeacherSchedulingPreference>
        teacherSchedulingPreferences;

    std::vector<ClassGroupSchedulingPreference>
        classGroupSchedulingPreferences;

    std::vector<SubjectSchedulingPreference>
        subjectSchedulingPreferences;

    int daysPerWeek = 5;
    int slotsPerDay = 8;

    OptimizationSettings optimizationSettings;
};
