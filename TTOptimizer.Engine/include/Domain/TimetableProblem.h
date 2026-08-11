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

struct TeacherTimeSlotPreference
{
    TeacherId teacherId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{ TimeSlotPreferenceType::Available };
};

struct ClassGroupTimeSlotPreference
{
    ClassGroupId classGroupId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{ TimeSlotPreferenceType::Available };
};

struct RoomTimeSlotPreference
{
    RoomId roomId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{ TimeSlotPreferenceType::Available };
};

struct SubjectTimeSlotPreference
{
    SubjectId subjectId{};
    int dayIndex{};
    int slotIndex{};
    TimeSlotPreferenceType preferenceType{ TimeSlotPreferenceType::Available };
};

/*
 * Legacy hard-unavailability views are kept temporarily because the current
 * preprocessing validators still consume them. JsonReader derives these
 * collections automatically from TimeSlotPreferenceType::Unavailable.
 */
struct TeacherUnavailability
{
    TeacherId teacherId{};
    int dayIndex{};
    int slotIndex{};
};

struct ClassGroupUnavailability
{
    ClassGroupId classGroupId{};
    int dayIndex{};
    int slotIndex{};
};

struct RoomUnavailability
{
    RoomId roomId{};
    int dayIndex{};
    int slotIndex{};
};

struct TimetableProblem
{
    std::vector<Teacher> teachers;
    std::vector<ClassGroup> classGroups;
    std::vector<Subject> subjects;
    std::vector<Room> rooms;
    std::vector<LessonRequirement> lessonRequirements;

    std::vector<TeacherTimeSlotPreference> teacherTimeSlotPreferences;
    std::vector<ClassGroupTimeSlotPreference> classGroupTimeSlotPreferences;
    std::vector<RoomTimeSlotPreference> roomTimeSlotPreferences;
    std::vector<SubjectTimeSlotPreference> subjectTimeSlotPreferences;

    std::vector<TeacherUnavailability> teacherUnavailabilities;
    std::vector<ClassGroupUnavailability> classGroupUnavailabilities;
    std::vector<RoomUnavailability> roomUnavailabilities;

    int daysPerWeek = 5;
    int slotsPerDay = 8;

    OptimizationSettings optimizationSettings;
};
