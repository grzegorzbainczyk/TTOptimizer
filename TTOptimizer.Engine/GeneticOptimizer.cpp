#include "Optimization/GeneticOptimizer.h"

#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <utility>

GeneticOptimizer::GeneticOptimizer(unsigned int seed)
    : mutator(seed),
    randomEngine(seed)
{
}

Chromosome GeneticOptimizer::optimize(
    const Chromosome& initialChromosome,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots,
    int generations,
    int populationSize,
    int eliteCount,
    int tournamentSize)
{
    if (generations <= 0)
    {
        throw std::invalid_argument(
            "Generations must be greater than zero.");
    }

    if (populationSize <= 0)
    {
        throw std::invalid_argument(
            "Population size must be greater than zero.");
    }

    if (eliteCount < 0 || eliteCount >= populationSize)
    {
        throw std::invalid_argument(
            "Elite count must be non-negative and smaller than population size.");
    }

    if (tournamentSize <= 0 || tournamentSize > populationSize)
    {
        throw std::invalid_argument(
            "Tournament size must be between 1 and population size.");
    }

    std::vector<Chromosome> population = createInitialPopulation(initialChromosome, populationSize);

    evaluatePopulation(
        population,
        problem,
        lessonInstances,
        scheduleSlots);

    sortPopulation(population);

    Chromosome bestChromosome = population.front();

    std::cerr
        << "Initial population best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';

    for (int generation = 1; generation <= generations; ++generation)
    {
        sortPopulation(population);

        std::vector<Chromosome> nextPopulation;
        nextPopulation.reserve(static_cast<std::size_t>(populationSize));

        // Elitism: copy the best chromosomes unchanged.
        for (int index = 0; index < eliteCount; ++index)
        {
            nextPopulation.push_back(
                population[static_cast<std::size_t>(index)]);
        }

        // Stage 1:
        // select a parent from the population, copy it,
        // then mutate the child by swapping two genes.
        while (nextPopulation.size()
            < static_cast<std::size_t>(populationSize))
        {
            const Chromosome& parent =
                selectByTournament(
                    population,
                    tournamentSize);

            Chromosome child = parent;

            mutator.mutateBySwap(child);

            child.fitness = fitnessEvaluator.evaluate(
                child,
                problem,
                lessonInstances,
                scheduleSlots);

            nextPopulation.push_back(
                std::move(child));
        }

        population = std::move(nextPopulation);

        sortPopulation(population);

        if (population.front().fitness.isBetterThan(
            bestChromosome.fitness))
        {
            bestChromosome = population.front();

            std::cerr
                << "Generation: "
                << generation
                << ", new best: hard violations = "
                << bestChromosome.fitness.hardViolationCount
                << ", soft penalty = "
                << bestChromosome.fitness.softPenalty
                << '\n';
        }

        if (bestChromosome.fitness.isFeasible()
            && bestChromosome.fitness.softPenalty == 0.0)
        {
            std::cerr
                << "Perfect solution found in generation "
                << generation
                << ".\n";

            break;
        }
    }

    std::cerr
        << "Final best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';


    //test
    bestChromosome.fitness = fitnessEvaluator.evaluate(
        bestChromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    return bestChromosome;
}

std::vector<Chromosome>
GeneticOptimizer::createInitialPopulation(
    const Chromosome& initialChromosome,
    int populationSize)
{
    std::vector<Chromosome> population;
    population.reserve(
        static_cast<std::size_t>(populationSize));

    // Preserve the original chromosome as the first member.
    population.push_back(initialChromosome);

    for (int populationIndex = 1;
        populationIndex < populationSize;
        ++populationIndex)
    {
        Chromosome chromosome = initialChromosome;

        // Apply several random swaps to increase population diversity.
        const int mutationCount = 1 + populationIndex % std::max( 1, static_cast<int>( initialChromosome.genes.size() / 4));

        for (int mutationIndex = 0;
            mutationIndex < mutationCount;
            ++mutationIndex)
        {
            mutator.mutateBySwap(chromosome);
        }

        population.push_back(
            std::move(chromosome));
    }

    return population;
}

void GeneticOptimizer::evaluatePopulation(
    std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    for (Chromosome& chromosome : population)
    {
        chromosome.fitness =
            fitnessEvaluator.evaluate(
                chromosome,
                problem,
                lessonInstances,
                scheduleSlots);
    }
}

void GeneticOptimizer::sortPopulation(
    std::vector<Chromosome>& population)
{
    std::sort(
        population.begin(),
        population.end(),
        isBetter);
}

const Chromosome& GeneticOptimizer::selectByTournament(
    const std::vector<Chromosome>& population,
    int tournamentSize)
{
    std::uniform_int_distribution<std::size_t> distribution(
        0,
        population.size() - 1);

    const Chromosome* winner =
        &population[distribution(randomEngine)];

    for (int competitorIndex = 1;
        competitorIndex < tournamentSize;
        ++competitorIndex)
    {
        const Chromosome& competitor =
            population[distribution(randomEngine)];

        if (competitor.fitness.isBetterThan(
            winner->fitness))
        {
            winner = &competitor;
        }
    }

    return *winner;
}

bool GeneticOptimizer::isBetter(
    const Chromosome& first,
    const Chromosome& second)
{
    return first.fitness.isBetterThan(
        second.fitness);
}
