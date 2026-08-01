#include <algorithm>
#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include <../External/nlohmann/json.hpp>

#include "Domain/TimetableModels.h"
#include "Generators/ScheduleSlotGenerator.h"
#include "Generators/LessonInstanceGenerator.h"
#include "Evaluation/FitnessEvaluator.h"
#include "Evaluation/ChromosomeValidator.h"
#include "Optimization/GeneticOptimizer.h"
#include "Optimization/OptimizationProgress.h"
#include "Engine.h"
#include "ChromosomeDecoder.h"
#include "ResultJsonWriter.h"
#include "Preprocessing/TimetablePreprocessor.h"

int Engine::execute(const TimetableProblem& problem, std::string& result)
{
    try
    {
        TimetablePreprocessor preprocessor;
        ResultJsonWriter writer;

        PreprocessingResult preprocessingResult = preprocessor.process(problem);

        if (!preprocessingResult.canOptimize)
        {
            result = writer.writePreprocessingFailure(preprocessingResult);
            return 0;
        }

        std::vector<ScheduleSlot> scheduleSlots = ScheduleSlotGenerator::generate(problem);
        std::vector<LessonInstance> lessonInstances = LessonInstanceGenerator::generate(problem);

        FitnessEvaluator fitnessEvaluator;

        const auto startTime = std::chrono::steady_clock::now();

        const auto progressCallback =
            [](const OptimizationProgress& progress)
            {
                const nlohmann::json message =
                {
                    { "type", "progress" },
                    { "generation", progress.generation },
                    { "totalGenerations", progress.totalGenerations },
                    { "percentage", progress.percentage }
                };

                std::cout << message.dump() << '\n' << std::flush;
            };

        GeneticOptimizer optimizer(
            problem.optimizationSettings,
            progressCallback);

        std::vector<Chromosome> initialPopulation =
            optimizer.createInitialPopulation(problem, lessonInstances, scheduleSlots);

        const auto bestInitialChromosome = std::min_element(
            initialPopulation.begin(),
            initialPopulation.end(),
            [](const Chromosome& first, const Chromosome& second)
            {
                return first.fitness.isBetterThan(second.fitness);
            });

        if (bestInitialChromosome == initialPopulation.end())
        {
            throw std::runtime_error("Initial population is empty.");
        }

        const double initialPenalty = bestInitialChromosome->fitness.softPenalty;

        Chromosome bestChromosome =
            optimizer.optimize(std::move(initialPopulation), problem, lessonInstances, scheduleSlots);

        ChromosomeValidator::validate(bestChromosome, lessonInstances, scheduleSlots);

        FitnessScore score =
            fitnessEvaluator.evaluate(bestChromosome, problem, lessonInstances, scheduleSlots);

        std::vector<ScheduledLesson> scheduledLessons =
            ChromosomeDecoder::decode(bestChromosome, problem, lessonInstances, scheduleSlots);

        const auto endTime = std::chrono::steady_clock::now();

        const auto durationMilliseconds =
            std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

        OptimizationInfo feedback;
        feedback.durationMilliseconds = durationMilliseconds;
        feedback.iterations = problem.optimizationSettings.generations;
        feedback.randomSeed = problem.optimizationSettings.randomSeed;

        result = writer.writeSuccess(initialPenalty, score, scheduledLessons, feedback);

        return 0;
    }
    catch (const std::exception& exception)
    {
        std::cerr << exception.what() << '\n';
        return 1;
    }
}
