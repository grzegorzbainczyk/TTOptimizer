#pragma once
#include <cstddef>
#include <optional>
#include <string>
#include <vector>
#include "TimeTableModels.h"

struct TimetableProblem
{
    std::vector<Teacher> teachers;
    std::vector<ClassGroup> classGroups;
    std::vector<Subject> subjects;
    std::vector<Room> rooms;
    std::vector<LessonRequirement> lessonRequirements;

    int daysPerWeek = 5;
    int slotsPerDay = 8;

    OptimizationSettings optimizationSettings;
};