#pragma once

#include <map>
#include <utility>
#include <vector>

#include "Domain/TimetableModels.h"

using ClassGroupSubjectKey =
    std::pair<ClassGroupId, SubjectId>;

struct SubjectDayScheduleStats
{
    int lessonCount{};
    int adjacentPairCount{};
    int unpairedLessonCount{};
};

struct SubjectClassScheduleStats
{
    int lessonCount{};
    int daysUsed{};
    std::vector<SubjectDayScheduleStats> days;
};

struct SubjectScheduleStats
{
    std::map<
        ClassGroupSubjectKey,
        SubjectClassScheduleStats>
        byClassGroupAndSubject;
};
