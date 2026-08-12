#pragma once

#include <vector>

#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/TeacherScheduleStats.h"
#include "Evaluation/Rules/ClassGroupScheduleStats.h"
#include "Evaluation/Rules/SubjectScheduleStats.h"

struct ConstraintRuleContext
{
    const Chromosome& chromosome;
    const TimetableProblem& problem;
    const std::vector<LessonInstance>& lessonInstances;
    const std::vector<ScheduleSlot>& scheduleSlots;
    const TeacherScheduleStats& teacherScheduleStats;
    const ClassGroupScheduleStats& classGroupScheduleStats;
    const SubjectScheduleStats& subjectScheduleStats;
};
