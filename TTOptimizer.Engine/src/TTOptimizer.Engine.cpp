#include <iostream>
#include <vector>
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
	try
	{
		if (argc >= 2)
		{
			std::string mode = argv[1];

			if (mode == "--json")
			{
				return RunJsonMode();
			}

			if (mode == "--demo")
			{
				return RunDemoMode();
			}

			std::cerr << "Unknown mode: " << mode << '\n';
			std::cerr << "Supported modes: --demo, --json\n";
			return 1;
		}

		return RunDemoMode();
	}
	catch (const std::exception& exception)
	{
		std::cerr << "Fatal error: " << exception.what() << '\n';
		return 1;
	}
}


