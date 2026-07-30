#include "Optimization/GeneticOptimizer.h"

#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <utility>

#include "Evaluation/ChromosomeValidator.h"

GeneticOptimizer::GeneticOptimizer(const OptimizationSettings& settings)
    : settings(settings),
    chromosomeFactory(settings.randomSeed),
    mutator(settings.randomSeed),
    randomEngine(settings.randomSeed)
{
}

std::vector<Chromosome> GeneticOptimizer::createInitialPopulation(
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    const int populationSize = settings.populationSize;

    if (populationSize <= 0)
    {
        throw std::invalid_argument("Population size must be greater than zero.");
    }

    std::vector<Chromosome> population;
    population.reserve(static_cast<std::size_t>(populationSize));

    for (int index = 0; index < populationSize; ++index)
    {
        Chromosome chromosome = chromosomeFactory.createRandom(scheduleSlots, lessonInstances);

        ChromosomeValidator::validate(chromosome, lessonInstances, scheduleSlots);

        chromosome.fitness = fitnessEvaluator.evaluate(chromosome, problem, lessonInstances, scheduleSlots);

        population.push_back(std::move(chromosome));
    }

    return population;
}

Chromosome GeneticOptimizer::optimize(
    std::vector<Chromosome> initialPopulation,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    validateOptimizationInput(initialPopulation, lessonInstances, scheduleSlots);

    const int generations = settings.iterations;
    const int eliteCount = settings.eliteCount;
    const int populationSize = static_cast<int>(initialPopulation.size());

    std::vector<Chromosome> population = std::move(initialPopulation);

    evaluatePopulation(population, problem, lessonInstances, scheduleSlots);
    sortPopulation(population);

    Chromosome bestChromosome = population.front();

    std::bernoulli_distribution mutationDistribution(settings.mutationProbability);

    std::cerr << "Initial population best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';

    for (int generation = 1; generation <= generations; ++generation)
    {
        sortPopulation(population);

        std::vector<Chromosome> nextPopulation;
        nextPopulation.reserve(static_cast<std::size_t>(populationSize));

        for (int index = 0; index < eliteCount; ++index)
        {
            nextPopulation.push_back(population[static_cast<std::size_t>(index)]);
        }

        while (nextPopulation.size() < static_cast<std::size_t>(populationSize))
        {
            const Chromosome& parent = selectByTournament(population);

            nextPopulation.push_back(
                createChild(parent, problem, lessonInstances, scheduleSlots, mutationDistribution));
        }

        population = std::move(nextPopulation);

        sortPopulation(population);

        if (population.front().fitness.isBetterThan(bestChromosome.fitness))
        {
            bestChromosome = population.front();

            std::cerr << "Generation: "
                << generation
                << ", new best: hard violations = "
                << bestChromosome.fitness.hardViolationCount
                << ", soft penalty = "
                << bestChromosome.fitness.softPenalty
                << '\n';
        }

        if (shouldStop(bestChromosome))
        {
            std::cerr << "Perfect solution found in generation " << generation << ".\n";
            break;
        }
    }

    bestChromosome.fitness = fitnessEvaluator.evaluate(bestChromosome, problem, lessonInstances, scheduleSlots);

    return bestChromosome;
}

void GeneticOptimizer::validateOptimizationInput(
    const std::vector<Chromosome>& initialPopulation,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    const int populationSize = static_cast<int>(initialPopulation.size());

    if (settings.iterations <= 0)
    {
        throw std::invalid_argument("Generations must be greater than zero.");
    }

    if (initialPopulation.empty())
    {
        throw std::invalid_argument("Initial population cannot be empty.");
    }

    if (scheduleSlots.empty() && !lessonInstances.empty())
    {
        throw std::invalid_argument("Schedule slots cannot be empty when lesson instances exist.");
    }

    if (settings.eliteCount < 0 || settings.eliteCount >= populationSize)
    {
        throw std::invalid_argument("Elite count must be non-negative and smaller than population size.");
    }

    if (settings.tournamentSize <= 0 || settings.tournamentSize > populationSize)
    {
        throw std::invalid_argument("Tournament size must be between 1 and population size.");
    }

    if (settings.mutationAttempts < 0)
    {
        throw std::invalid_argument("Mutation attempts cannot be negative.");
    }

    if (settings.mutationProbability < 0.0 || settings.mutationProbability > 1.0)
    {
        throw std::invalid_argument("Mutation probability must be between 0.0 and 1.0.");
    }
}

Chromosome GeneticOptimizer::createChild(
    const Chromosome& parent,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots,
    std::bernoulli_distribution& mutationDistribution)
{
    Chromosome child = parent;

    if (!mutationDistribution(randomEngine))
    {
        return child;
    }

    for (int attempt = 0; attempt < settings.mutationAttempts; ++attempt)
    {
        Chromosome candidate = parent;

        mutator.mutateAssignment(candidate, scheduleSlots.size());

        candidate.fitness = fitnessEvaluator.evaluate(candidate, problem, lessonInstances, scheduleSlots);

        if (candidate.fitness.isBetterThan(child.fitness))
        {
            child = std::move(candidate);
        }
    }

    return child;
}

bool GeneticOptimizer::shouldStop(const Chromosome& bestChromosome) const
{
    return settings.stopWhenPerfect
        && bestChromosome.fitness.isFeasible()
        && bestChromosome.fitness.softPenalty == 0.0;
}

void GeneticOptimizer::evaluatePopulation(
    std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    for (Chromosome& chromosome : population)
    {
        ChromosomeValidator::validate(chromosome, lessonInstances, scheduleSlots);

        chromosome.fitness = fitnessEvaluator.evaluate(chromosome, problem, lessonInstances, scheduleSlots);
    }
}

void GeneticOptimizer::sortPopulation(std::vector<Chromosome>& population)
{
    std::sort(population.begin(), population.end(), isBetter);
}

const Chromosome& GeneticOptimizer::selectByTournament(const std::vector<Chromosome>& population)
{
    std::uniform_int_distribution<std::size_t> distribution(0, population.size() - 1);

    const Chromosome* winner = &population[distribution(randomEngine)];

    for (int index = 1; index < settings.tournamentSize; ++index)
    {
        const Chromosome& competitor = population[distribution(randomEngine)];

        if (competitor.fitness.isBetterThan(winner->fitness))
        {
            winner = &competitor;
        }
    }

    return *winner;
}

bool GeneticOptimizer::isBetter(const Chromosome& first, const Chromosome& second)
{
    return first.fitness.isBetterThan(second.fitness);
}