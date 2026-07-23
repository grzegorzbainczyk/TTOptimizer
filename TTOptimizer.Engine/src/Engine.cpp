#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include <string>
#include <chrono>
#include <stdexcept>
#include "Domain/TimetableModels.h"

#include "Generators/ScheduleSlotGenerator.h"
#include "Generators/LessonInstanceGenerator.h"
#include "Generators/ChromosomeFactory.h"

#include "Evaluation/FitnessEvaluator.h"
#include "Evaluation/ChromosomeValidator.h"

#include "Optimization/ChromosomeMutator.h"
#include "Optimization/SimpleOptimizer.h"


#include "Utils/Utils.h"
#include "Engine.h"
#include "TimetableProblemJsonReader.h"

#include "ChromosomeDecoder.h"
#include <ScheduledLessonResultJsonWriter.h>

void Engine::CreateInitialChromosome(Chromosome& initialChromosome, 
	std::vector<ScheduleSlot>& scheduleSlots, 
	std::vector<LessonInstance>& lessonInstances, 
	FitnessEvaluator& fitnessEvaluator, 
	const TimetableProblem& problem)
{
	ChromosomeFactory chromosomeFactory(123);
	initialChromosome =
		chromosomeFactory.createRandom(scheduleSlots, lessonInstances);
	ChromosomeValidator::validate(initialChromosome, lessonInstances, scheduleSlots);

	initialChromosome.penalty = fitnessEvaluator.evaluate(
		initialChromosome,
		problem,
		lessonInstances,
		scheduleSlots);
}

int Engine::execute(const TimetableProblem& problem, std::string& result)
{
	try
	{	
		Chromosome initialChromosome; 
		std::vector<ScheduleSlot> scheduleSlots;
		std::vector<LessonInstance> lessonInstances;

		scheduleSlots = ScheduleSlotGenerator::generate(problem);		
		lessonInstances = LessonInstanceGenerator::generate(problem);
		FitnessEvaluator fitnessEvaluator;

		const auto startTime = std::chrono::steady_clock::now();

		CreateInitialChromosome(initialChromosome, scheduleSlots, lessonInstances, fitnessEvaluator, problem);

		const double initialPenalty = initialChromosome.penalty;

		SimpleOptimizer optimizer(456);
		Chromosome bestChromosome = optimizer.optimize(
			initialChromosome,
			problem,
			lessonInstances,
			scheduleSlots,
			problem.optimizationSettings.iterations);

		ChromosomeValidator::validate(bestChromosome, lessonInstances, scheduleSlots);

		double bestPenalty = fitnessEvaluator.evaluate(bestChromosome, problem, lessonInstances, scheduleSlots);		
		std::vector<ScheduledLesson> scheduledLessons = ChromosomeDecoder::decode(bestChromosome, problem, lessonInstances, scheduleSlots);


		const auto endTime = std::chrono::steady_clock::now();
		const auto durationMilliseconds =
			std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
		const std::string durationString = std::to_string(durationMilliseconds);

		OptimizationInfo feedback;
		feedback.Message = durationString;

		ScheduledLessonResultJsonWriter writer;

		result = writer.writeSuccess(
			initialPenalty,
			bestPenalty,
			scheduledLessons,
			feedback
		);

		return 0;
	}
	catch (const std::exception& exception)
	{
		std::cout << exception.what() << '\n';
		return 1;
	}
}




