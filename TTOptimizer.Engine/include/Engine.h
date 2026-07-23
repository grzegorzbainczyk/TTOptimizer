#pragma once
#include "Domain/TimetableModels.h"
#include <Evaluation/FitnessEvaluator.h>

class Engine
{
public:
	void CreateInitialChromosome(Chromosome& initialChromosome, std::vector<ScheduleSlot>& scheduleSlots, std::vector<LessonInstance>& lessonInstances, FitnessEvaluator& fitnessEvaluator, const TimetableProblem& problem);
	int execute(const TimetableProblem& problem, std::string& result);
};