#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include <string>
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
#include <Output/EngineResultJsonWriter.h>
#include "TimetableProblemJsonReader.h"
#include "Output/OptimizationResultJsonWriter.h"


#include "OptimizationResultJsonWriter.h"
#include "ChromosomeDecoder.h"
#include "ScheduledLessonResultJsonWriter.h"

int Engine::optimize(const TimetableProblem& problem, std::string& result)
{
	try
	{		
		std::vector<ScheduleSlot> scheduleSlots = ScheduleSlotGenerator::generate(problem);
		
		std::vector<LessonInstance> lessonInstances = LessonInstanceGenerator::generate(problem);

		ChromosomeFactory chromosomeFactory(123);
		Chromosome initialChromosome =
			chromosomeFactory.createRandom(scheduleSlots, lessonInstances);
		
		ChromosomeValidator::validate(initialChromosome, lessonInstances, scheduleSlots);

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
			problem.optimizationSettings.iterations);

		ChromosomeValidator::validate(bestChromosome, lessonInstances, scheduleSlots);

		double bestPenalty = fitnessEvaluator.evaluate(bestChromosome, problem, lessonInstances, scheduleSlots);
		
		std::vector<ScheduledLesson> scheduledLessons = ChromosomeDecoder::decode(bestChromosome, problem, lessonInstances, scheduleSlots);

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




