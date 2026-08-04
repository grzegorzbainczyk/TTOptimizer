#pragma once

#include <vector>
#include "TimetableModels.h"

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

    std::vector<TeacherUnavailability> teacherUnavailabilities;
    std::vector<ClassGroupUnavailability> classGroupUnavailabilities;
    std::vector<RoomUnavailability> roomUnavailabilities;

    int daysPerWeek = 5;
    int slotsPerDay = 8;

    OptimizationSettings optimizationSettings;
};