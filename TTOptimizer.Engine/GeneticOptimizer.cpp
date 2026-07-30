#include "Optimization/GeneticOptimizer.h"

#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <utility>

#include "Evaluation/ChromosomeValidator.h"

GeneticOptimizer::GeneticOptimizer(unsigned int seed)
    : chromosomeFactory(seed),
    mutator(seed),
    randomEngine(seed)
{
}

std::vector<Chromosome>
GeneticOptimizer::createInitialPopulation(
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots,
    int populationSize)
{
    if (populationSize <= 0)
    {
        throw std::invalid_argument(
            "Population size must be greater than zero.");
    }

    std::vector<Chromosome> population;
    population.reserve(
        static_cast<std::size_t>(populationSize));

    for (int index = 0;
        index < populationSize;
        ++index)
    {
        Chromosome chromosome =
            chromosomeFactory.createRandom(
                scheduleSlots,
                lessonInstances);

        ChromosomeValidator::validate(
            chromosome,
            lessonInstances,
            scheduleSlots);

        chromosome.fitness =
            fitnessEvaluator.evaluate(
                chromosome,
                problem,
                lessonInstances,
                scheduleSlots);

        population.push_back(
            std::move(chromosome));
    }

    return population;
}

Chromosome GeneticOptimizer::optimize(
    std::vector<Chromosome> initialPopulation,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots,
    int generations,
    int eliteCount,
    int tournamentSize)
{
    if (generations <= 0)
    {
        throw std::invalid_argument(
            "Generations must be greater than zero.");
    }

    if (initialPopulation.empty())
    {
        throw std::invalid_argument(
            "Initial population cannot be empty.");
    }

    if (scheduleSlots.empty() &&
        !lessonInstances.empty())
    {
        throw std::invalid_argument(
            "Schedule slots cannot be empty "
            "when lesson instances exist.");
    }

    const int populationSize =
        static_cast<int>(
            initialPopulation.size());

    if (eliteCount < 0 ||
        eliteCount >= populationSize)
    {
        throw std::invalid_argument(
            "Elite count must be non-negative "
            "and smaller than population size.");
    }

    if (tournamentSize <= 0 ||
        tournamentSize > populationSize)
    {
        throw std::invalid_argument(
            "Tournament size must be between 1 "
            "and population size.");
    }

    std::vector<Chromosome> population =
        std::move(initialPopulation);

    evaluatePopulation(
        population,
        problem,
        lessonInstances,
        scheduleSlots);

    sortPopulation(population);

    Chromosome bestChromosome =
        population.front();

    std::cerr
        << "Initial population best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';

    for (int generation = 1;
        generation <= generations;
        ++generation)
    {
        sortPopulation(population);

        std::vector<Chromosome> nextPopulation;
        nextPopulation.reserve(
            static_cast<std::size_t>(
                populationSize));

        for (int index = 0;
            index < eliteCount;
            ++index)
        {
            nextPopulation.push_back(
                population[
                    static_cast<std::size_t>(
                        index)]);
        }

        while (nextPopulation.size() <
            static_cast<std::size_t>(
                populationSize))
        {
            const Chromosome& parent =
                selectByTournament(
                    population,
                    tournamentSize);

            Chromosome child = parent;

            constexpr int mutationAttempts = 5;

            for (int attempt = 0;
                attempt < mutationAttempts;
                ++attempt)
            {
                Chromosome candidate = parent;

                mutator.mutateAssignment(
                    candidate,
                    scheduleSlots.size());

                candidate.fitness =
                    fitnessEvaluator.evaluate(
                        candidate,
                        problem,
                        lessonInstances,
                        scheduleSlots);

                if (candidate.fitness.isBetterThan(
                    child.fitness))
                {
                    child =
                        std::move(candidate);
                }
            }

            nextPopulation.push_back(
                std::move(child));
        }

        population =
            std::move(nextPopulation);

        sortPopulation(population);

        if (population.front().fitness.isBetterThan(
            bestChromosome.fitness))
        {
            bestChromosome =
                population.front();

            std::cerr
                << "Generation: "
                << generation
                << ", new best: hard violations = "
                << bestChromosome
                .fitness
                .hardViolationCount
                << ", soft penalty = "
                << bestChromosome
                .fitness
                .softPenalty
                << '\n';
        }

        if (bestChromosome.fitness.isFeasible() &&
            bestChromosome.fitness.softPenalty == 0.0)
        {
            std::cerr
                << "Perfect solution found in generation "
                << generation
                << ".\n";

            break;
        }
    }

    bestChromosome.fitness =
        fitnessEvaluator.evaluate(
            bestChromosome,
            problem,
            lessonInstances,
            scheduleSlots);

    return bestChromosome;
}

void GeneticOptimizer::evaluatePopulation(
    std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    for (Chromosome& chromosome : population)
    {
        ChromosomeValidator::validate(
            chromosome,
            lessonInstances,
            scheduleSlots);

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

const Chromosome&
GeneticOptimizer::selectByTournament(
    const std::vector<Chromosome>& population,
    int tournamentSize)
{
    std::uniform_int_distribution<std::size_t>
        distribution(
            0,
            population.size() - 1);

    const Chromosome* winner =
        &population[
            distribution(randomEngine)];

    for (int index = 1;
        index < tournamentSize;
        ++index)
    {
        const Chromosome& competitor =
            population[
                distribution(randomEngine)];

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