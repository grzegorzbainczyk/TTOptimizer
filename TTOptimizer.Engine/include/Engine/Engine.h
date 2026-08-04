#pragma once
#include "Domain/TimetableModels.h"
#include <Evaluation/FitnessEvaluator.h>

class Engine
{
public:	
	int execute(const TimetableProblem& problem, std::string& result);
};