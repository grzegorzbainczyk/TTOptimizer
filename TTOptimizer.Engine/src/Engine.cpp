#include <algorithm>
#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "Domain/TimetableModels.h"
#include "Generators/ScheduleSlotGenerator.h"
#include "Generators/LessonInstanceGenerator.h"
#include "Evaluation/FitnessEvaluator.h"
#include "Evaluation/ChromosomeValidator.h"
#include "Optimization/GeneticOptimizer.h"
#include "Engine.h"
#include "ChromosomeDecoder.h"
#include <ScheduledLessonResultJsonWriter.h>
#include <Preprocessing/TimetablePreprocessor.h>

int Engine::execute(
    const TimetableProblem& problem,
    std::string& result)
{
    try
    {
        TimetablePreprocessor preprocessor;
        ResultJsonWriter writer;

        PreprocessingResult preprocessingResult =
            preprocessor.process(problem);

        if (!preprocessingResult.canOptimize)
        {
            result = writer.writePreprocessingFailure(preprocessingResult);
            return 0;
        }


        std::vector<ScheduleSlot> scheduleSlots =
            ScheduleSlotGenerator::generate(problem);

        std::vector<LessonInstance> lessonInstances =
            LessonInstanceGenerator::generate(problem);

        FitnessEvaluator fitnessEvaluator;

        const auto startTime = std::chrono::steady_clock::now();
        GeneticOptimizer optimizer(problem.optimizationSettings.randomSeed);

        const int generations = 1000;
        const int populationSize = 100;
        const int eliteCount = 5;
        const int tournamentSize = 3;

        std::vector<Chromosome> initialPopulation =
            optimizer.createInitialPopulation(
                problem,
                lessonInstances,
                scheduleSlots,
                populationSize);

        const auto bestInitialChromosome =
            std::min_element(
                initialPopulation.begin(),
                initialPopulation.end(),
                [](const Chromosome& first,
                    const Chromosome& second)
                {
                    return first.fitness.isBetterThan(
                        second.fitness);
                });

        if (bestInitialChromosome == initialPopulation.end())
        {
            throw std::runtime_error(
                "Initial population is empty.");
        }

        const double initialPenalty =
            bestInitialChromosome->fitness.softPenalty;

        Chromosome bestChromosome = optimizer.optimize(
            std::move(initialPopulation),
            problem,
            lessonInstances,
            scheduleSlots,
            generations,
            eliteCount,
            tournamentSize);

        ChromosomeValidator::validate(
            bestChromosome,
            lessonInstances,
            scheduleSlots);

        FitnessScore score = fitnessEvaluator.evaluate(
            bestChromosome,
            problem,
            lessonInstances,
            scheduleSlots);

        std::vector<ScheduledLesson> scheduledLessons =
            ChromosomeDecoder::decode(
                bestChromosome,
                problem,
                lessonInstances,
                scheduleSlots);

        const auto endTime =
            std::chrono::steady_clock::now();

        const auto durationMilliseconds =
            std::chrono::duration_cast<std::chrono::milliseconds>(
                endTime - startTime)
            .count();

        OptimizationInfo feedback;
        feedback.durationMilliseconds = durationMilliseconds;
        feedback.iterations = problem.optimizationSettings.iterations; //why copy input to output ?
        feedback.randomSeed = problem.optimizationSettings.randomSeed; //why copy input to output ?
      

        result = writer.writeSuccess(
            initialPenalty,
            score,
            scheduledLessons,
            feedback);

        return 0;
    }
    catch (const std::exception& exception)
    {
        std::cout << exception.what() << '\n';
        return 1;
    }
}
