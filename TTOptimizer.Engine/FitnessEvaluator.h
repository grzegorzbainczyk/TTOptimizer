#pragma once

#include <vector>
#include "TimetableModels.h"

class FitnessEvaluator
{
public:
    double evaluate(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;
};