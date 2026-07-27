#pragma once
#include <cstddef>
#include <optional>
#include <string>
#include <vector>
#include "TimeTableModels.h"

struct TeacherUnavailability
{
    int teacherId;
    int dayIndex;
    int slotIndex;
};

struct ClassGroupUnavailability
{
    int classGroupId;
    int dayIndex;
    int slotIndex;
};

struct RoomUnavailability
{
    int roomId;
    int dayIndex;
    int slotIndex;
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