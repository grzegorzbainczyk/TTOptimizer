#pragma once

#include <vector>

#include "Domain/TimetableModels.h"

class ChromosomeValidator
{
public:
    void validate(
        const Chromosome& chromosome,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;
};