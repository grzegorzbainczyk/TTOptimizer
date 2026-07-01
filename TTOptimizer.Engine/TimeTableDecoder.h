#pragma once

#include <vector>

#include "TimetableModels.h"

class TimetableDecoder
{
public:
    std::vector<ScheduledLesson> decode(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;
};

