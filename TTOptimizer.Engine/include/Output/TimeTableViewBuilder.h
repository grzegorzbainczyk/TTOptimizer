#pragma once

#include <vector>

#include "Domain/TimetableModels.h"

class TimetableViewBuilder
{
public:
    std::vector<ScheduledLessonView> build(
        const std::vector<ScheduledLesson>& scheduledLessons,
        const TimetableProblem& problem) const;
};

