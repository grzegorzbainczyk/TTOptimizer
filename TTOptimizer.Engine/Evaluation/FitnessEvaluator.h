#pragma once

#include <vector>

#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"
#include "Evaluation/FitnessScore.h"
#include "Evaluation/Rules/ConstraintRuleRegistry.h"

class FitnessEvaluator
{
public:
    FitnessScore evaluate(
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots) const;

private:
    ConstraintRuleRegistry ruleRegistry_;
};
