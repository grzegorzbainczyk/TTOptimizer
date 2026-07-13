#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include <string>
#include "Domain/TimetableModels.h"
#include "TestData/test1.h"
#include "TestData/test2.h"

#include "Generators/ScheduleSlotGenerator.h"
#include "Generators/LessonInstanceGenerator.h"
#include "Generators/ChromosomeFactory.h"

#include "Evaluation/FitnessEvaluator.h"
#include "Evaluation/ChromosomeValidator.h"

#include "Optimization/ChromosomeMutator.h"
#include "Optimization/SimpleOptimizer.h"

#include "Output/TimetableDecoder.h"
#include "Output/TimetableViewBuilder.h"

#include "Utils/Utils.h"
#include "Output/TimetableJsonWriter.h"
#include "TTOptimizer.Engine.h"
#include <Output/EngineResultJsonWriter.h>

int RunDemoMode()
{
	TimetableProblem problem = CreateTestProblem1();

	ScheduleSlotGenerator scheduleSlotGenerator;
	std::vector<ScheduleSlot> scheduleSlots =
		scheduleSlotGenerator.generate(problem);

	LessonInstanceGenerator lessonInstanceGenerator;
	std::vector<LessonInstance> lessonInstances =
		lessonInstanceGenerator.generate(problem);

	ChromosomeFactory chromosomeFactory(123);
	Chromosome initialChromosome =
		chromosomeFactory.createRandom(scheduleSlots, lessonInstances);

	ChromosomeValidator validator;
	validator.validate(initialChromosome, lessonInstances, scheduleSlots);

	FitnessEvaluator fitnessEvaluator;

	initialChromosome.penalty = fitnessEvaluator.evaluate(
		initialChromosome,
		problem,
		lessonInstances,
		scheduleSlots);

	const double initialPenalty = initialChromosome.penalty;

	SimpleOptimizer optimizer(456);

	Chromosome bestChromosome = optimizer.optimize(
		initialChromosome,
		problem,
		lessonInstances,
		scheduleSlots,
		1000);

	validator.validate(bestChromosome, lessonInstances, scheduleSlots);

	std::cout << "Initial penalty: " << initialPenalty << '\n';
	std::cout << "Best penalty: " << bestChromosome.penalty << '\n';
	std::cout << "Genes: " << bestChromosome.genes.size() << '\n';

	return 0;
}

int RunJsonMode()
{
	EngineResultJsonWriter jsonWriter;

	try
	{
		TimetableProblem problem = CreateTestProblem1();

		ScheduleSlotGenerator scheduleSlotGenerator;
		std::vector<ScheduleSlot> scheduleSlots =
			scheduleSlotGenerator.generate(problem);

		LessonInstanceGenerator lessonInstanceGenerator;
		std::vector<LessonInstance> lessonInstances =
			lessonInstanceGenerator.generate(problem);

		ChromosomeFactory chromosomeFactory(123);
		Chromosome initialChromosome =
			chromosomeFactory.createRandom(scheduleSlots, lessonInstances);

		ChromosomeValidator validator;
		validator.validate(initialChromosome, lessonInstances, scheduleSlots);

		FitnessEvaluator fitnessEvaluator;

		initialChromosome.penalty = fitnessEvaluator.evaluate(
			initialChromosome,
			problem,
			lessonInstances,
			scheduleSlots);

		const double initialPenalty = initialChromosome.penalty;

		SimpleOptimizer optimizer(456);

		Chromosome bestChromosome = optimizer.optimize(
			initialChromosome,
			problem,
			lessonInstances,
			scheduleSlots,
			100);

		validator.validate(bestChromosome, lessonInstances, scheduleSlots);

		std::cout << jsonWriter.writeSuccess(
			initialPenalty,
			bestChromosome.penalty,
			bestChromosome) << '\n';

		return 0;
	}
	catch (const std::exception& exception)
	{
		std::cout << jsonWriter.writeError(exception.what()) << '\n';
		return 1;
	}
}

int main(int argc, char* argv[])
{
	bool jsonOutput = false;
	std::string inputPath;

	for (int i = 1; i < argc; ++i)
	{
		std::string arg = argv[i];

		if (arg == "--json")
		{
			jsonOutput = true;
		}
		else if (arg == "--input" && i + 1 < argc)
		{
			inputPath = argv[++i];
		}
	}

	std::string inputJson;

	if (!inputPath.empty())
	{
		std::ifstream file(inputPath);

		if (!file)
		{
			std::cerr << "Could not open input file: " << inputPath << std::endl;
			return 1;
		}

		std::ostringstream buffer;
		buffer << file.rdbuf();
		inputJson = buffer.str();
	}

	// TODO:
	// 1. Parse inputJson
	// 2. Convert JSON to TimetableProblem
	// 3. Run optimization on that problem
	// 4. Return result JSON to stdout

	if (jsonOutput)
	{
		std::cout << R"({"success":true,"penalty":0,"lessons":[]})" << std::endl;
	}

	return 0;
}


