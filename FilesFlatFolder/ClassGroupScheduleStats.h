#pragma once

#include <unordered_map>
#include <vector>

#include "Domain/TimetableModels.h"

struct ClassGroupDayScheduleStats
{
    int lessonCount{};
    int firstSlot{ -1 };
    int lastSlot{ -1 };
    int maxConsecutiveLessons{};
};

struct ClassGroupScheduleStats
{
    std::unordered_map<
        ClassGroupId,
        std::vector<ClassGroupDayScheduleStats>>
        byClassGroup;
};
