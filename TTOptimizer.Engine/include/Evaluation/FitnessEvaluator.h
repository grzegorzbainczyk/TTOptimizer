#pragma once

#include <vector>
#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"

class FitnessEvaluator
{
public:
    double evaluate(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;
};