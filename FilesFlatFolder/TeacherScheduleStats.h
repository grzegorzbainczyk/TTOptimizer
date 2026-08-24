#pragma once

#include <unordered_map>
#include <vector>

#include "Domain/TimetableModels.h"

struct TeacherDayScheduleStats
{
    int lessonCount{};
    int firstSlot{ -1 };
    int lastSlot{ -1 };
    int maxConsecutiveLessons{};
};

struct TeacherScheduleStats
{
    std::unordered_map<
        TeacherId,
        std::vector<TeacherDayScheduleStats>>
        byTeacher;
};
