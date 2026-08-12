#pragma once

#include <vector>

#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/TeacherScheduleStats.h"

struct ConstraintRuleContext
{
    const Chromosome& chromosome;
    const TimetableProblem& problem;
    const std::vector<LessonInstance>& lessonInstances;
    const std::vector<ScheduleSlot>& scheduleSlots;
    const TeacherScheduleStats& teacherScheduleStats;
};
