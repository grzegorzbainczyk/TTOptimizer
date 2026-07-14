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
#include "TimetableProblemJsonReader.h"
#include "Output/OptimizationResultJsonWriter.h"

#include <stdexcept>
#include "../OptimizationResultJsonWriter.h"
#include "../ChromosomeDecoder.h"
#include "../ScheduledLessonResultJsonWriter.h"
//#include <nlohmann/json.hpp>

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

int optimize(const TimetableProblem& problem, std::string& result)
{
	//EngineResultJsonWriter jsonWriter;

	try
	{
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

		double bestPenalty = fitnessEvaluator.evaluate(bestChromosome, problem, lessonInstances, scheduleSlots);

		ChromosomeDecoder decoder;
		std::vector<ScheduledLesson> scheduledLessons = decoder.decode(bestChromosome, problem, lessonInstances, scheduleSlots);

		ScheduledLessonResultJsonWriter writer;

		result = writer.writeSuccess(
			initialPenalty,
			bestPenalty,
			scheduledLessons
		);

		return 0;
	}
	catch (const std::exception& exception)
	{
		std::cout << exception.what() << '\n';
		return 1;
	}
}

//using json = nlohmann::json;

int main(int argc, char* argv[])
{
	bool jsonOutput = false;
	std::string inputPath, outputPath;

	inputPath = argv[1];
	std::string inputJson;
	outputPath = argv[2];
	std::string outputJson;

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

	TimetableProblemJsonReader reader;
	TimetableProblem problem = reader.readFromFile(inputPath);

	std::cout << "Problem loaded.\n";
	std::cout << "Teachers: " << problem.teachers.size() << "\n";
	std::cout << "Classes: " << problem.classGroups.size() << "\n";
	std::cout << "Subjects: " << problem.subjects.size() << "\n";
	std::cout << "Rooms: " << problem.rooms.size() << "\n";
	std::cout << "Requirements: " << problem.lessonRequirements.size() << "\n";

	std::string result;
	optimize(problem, outputJson);

	if (!outputPath.empty())
	{
		std::ofstream file(outputPath);

		if (!file)
		{
			std::cerr << "Could not open output file: " << outputPath << std::endl;
			return 1;
		}

		file << outputJson;
	}
	else
	{
		std::cout << outputJson << std::endl;
	}
	
	return 0;
}


