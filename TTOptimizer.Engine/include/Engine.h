#pragma once
#include "Domain/TimetableModels.h"

class Engine
{
public:
	int optimize(const TimetableProblem& problem, std::string& result);
};