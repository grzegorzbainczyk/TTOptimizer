#include "Optimization/GeneticOptimizer.h"

#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <utility>

#include "Evaluation/Validation/ChromosomeValidator.h"

GeneticOptimizer::GeneticOptimizer(const OptimizationSettings& settings,
    ProgressCallback progressCallback)
    : settings(settings),
    progressCallback(std::move(progressCallback)),
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

    // Build independent random timetable candidates. Every chromosome is validated
    // and evaluated immediately, so the returned population already has valid fitness values.
    for (int index = 0; index < populationSize; ++index)
    {
        Chromosome chromosome = chromosomeFactory.createRandom(scheduleSlots, lessonInstances);

        ChromosomeValidator::validate(chromosome, lessonInstances, scheduleSlots);
        chromosome.fitness = fitnessEvaluator.evaluate(
            chromosome, problem, lessonInstances, scheduleSlots);

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
    // Keep this method at the level of the genetic algorithm itself. Detailed operations
    // are delegated to smaller methods, so this function can be read almost like pseudocode.
    validateOptimizationInput(initialPopulation, lessonInstances, scheduleSlots);

    std::vector<Chromosome> population = initializePopulation(
        std::move(initialPopulation), problem, lessonInstances, scheduleSlots);

    // initializePopulation() returns a sorted population, so front() is the initial best.
    Chromosome bestChromosome = population.front();
    int bestFoundAtGeneration = 0;
    int lastReportedPercentage = -1;

    reportInitialState(bestChromosome);
    reportProgress(0, settings.generations, bestFoundAtGeneration,
        bestChromosome, lastReportedPercentage);

    // Each iteration creates one complete generation. createNextGeneration() returns it sorted.
    for (int generation = 1; generation <= settings.generations; ++generation)
    {
        population = createNextGeneration(population, problem, lessonInstances, scheduleSlots);

        updateBestChromosome(population, bestChromosome, generation, bestFoundAtGeneration);
        reportProgress(generation, settings.generations, bestFoundAtGeneration,
            bestChromosome, lastReportedPercentage);

        if (shouldStopEarly(bestChromosome))
        {
            reportPerfectSolution(generation);
            break;
        }
    }

    // Final consistency check: recalculate fitness against the current problem and rules.
    bestChromosome.fitness = fitnessEvaluator.evaluate(
        bestChromosome, problem, lessonInstances, scheduleSlots);

    return bestChromosome;
}

void GeneticOptimizer::validateOptimizationInput(
    const std::vector<Chromosome>& initialPopulation,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    if (settings.generations <= 0)
    {
        throw std::invalid_argument("Generations must be greater than zero.");
    }

    if (initialPopulation.empty())
    {
        throw std::invalid_argument("Initial population cannot be empty.");
    }

    if (scheduleSlots.empty() && !lessonInstances.empty())
    {
        throw std::invalid_argument(
            "Schedule slots cannot be empty when lesson instances exist.");
    }

    const int populationSize = static_cast<int>(initialPopulation.size());

    if (settings.eliteCount < 0 || settings.eliteCount >= populationSize)
    {
        throw std::invalid_argument(
            "Elite count must be non-negative and smaller than population size.");
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

std::vector<Chromosome> GeneticOptimizer::initializePopulation(
    std::vector<Chromosome> population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    // Re-evaluate the population against exactly the data used by this optimization run.
    evaluatePopulation(population, problem, lessonInstances, scheduleSlots);

    // Contract: every population leaving this method is sorted from best to worst.
    sortPopulation(population);
    return population;
}

std::vector<Chromosome> GeneticOptimizer::createNextGeneration(
    const std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    const std::size_t populationSize = population.size();

    std::vector<Chromosome> nextPopulation;
    nextPopulation.reserve(populationSize);

    // Elitism protects the strongest chromosomes from random selection and mutation.
    copyElite(population, nextPopulation);

    // Fill the remaining positions with children created from tournament-selected parents.
    while (nextPopulation.size() < populationSize)
    {
        Chromosome child = createChild(population, problem, lessonInstances, scheduleSlots);
        nextPopulation.push_back(std::move(child));
    }

    // Contract: every completed generation is sorted from best to worst.
    sortPopulation(nextPopulation);
    return nextPopulation;
}

void GeneticOptimizer::copyElite(
    const std::vector<Chromosome>& population,
    std::vector<Chromosome>& nextPopulation) const
{
    for (int index = 0; index < settings.eliteCount; ++index)
    {
        nextPopulation.push_back(population[static_cast<std::size_t>(index)]);
    }
}

Chromosome GeneticOptimizer::createChild(
    const std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    const Chromosome& parent = selectByTournament(population);

    // If mutation is skipped, the selected parent survives unchanged as the child.
    std::bernoulli_distribution mutationDistribution(settings.mutationProbability);

    if (!mutationDistribution(randomEngine))
    {
        return parent;
    }

    return findBestMutation(parent, problem, lessonInstances, scheduleSlots);
}

Chromosome GeneticOptimizer::findBestMutation(
    const Chromosome& parent,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    // The parent is the baseline. A mutation is accepted only if it improves this baseline.
    Chromosome bestCandidate = parent;

    for (int attempt = 0; attempt < settings.mutationAttempts; ++attempt)
    {
        // Every attempt starts from the same parent, so mutation attempts are independent.
        Chromosome candidate = parent;
        mutator.mutateAssignment(candidate, scheduleSlots.size());

        candidate.fitness = fitnessEvaluator.evaluate(
            candidate, problem, lessonInstances, scheduleSlots);

        if (candidate.fitness.isBetterThan(bestCandidate.fitness))
        {
            bestCandidate = std::move(candidate);
        }
    }

    return bestCandidate;
}

void GeneticOptimizer::updateBestChromosome(
    const std::vector<Chromosome>& population,
    Chromosome& bestChromosome,
    int generation,
    int& bestFoundAtGeneration) const
{
    // createNextGeneration() returns a sorted population, so front() is this generation's best.
    const Chromosome& generationBest = population.front();

    if (!generationBest.fitness.isBetterThan(bestChromosome.fitness))
    {
        return;
    }

    bestChromosome = generationBest;
    bestFoundAtGeneration = generation;

    std::cerr << "Generation: " << generation
        << ", new best: hard violations = " << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = " << bestChromosome.fitness.softPenalty << '\n';
}

bool GeneticOptimizer::shouldStopEarly(const Chromosome& bestChromosome) const
{
    // A feasible solution with zero soft penalty cannot improve under the current fitness model.
    return settings.stopWhenPerfect
        && bestChromosome.fitness.isFeasible()
        && bestChromosome.fitness.softPenalty == 0.0;
}

void GeneticOptimizer::reportInitialState(const Chromosome& bestChromosome)
{
    std::cerr << "Initial population best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = " << bestChromosome.fitness.softPenalty << '\n';
}

void GeneticOptimizer::reportPerfectSolution(int generation)
{
    std::cerr << "Perfect solution found in generation " << generation << ".\n";
}

void GeneticOptimizer::reportProgress(
    int generation,
    int totalGenerations,
    int bestFoundAtGeneration,
    const Chromosome& bestChromosome,
    int& lastReportedPercentage) const
{
    if (!progressCallback)
    {
        return;
    }

    const int percentage = generation * 100 / totalGenerations;

    if (percentage == lastReportedPercentage)
    {
        return;
    }

    OptimizationProgress progress;
    progress.generation = generation;
    progress.totalGenerations = totalGenerations;
    progress.percentage = percentage;
    progress.bestFoundAtGeneration = bestFoundAtGeneration;
    progress.best.hardViolationCount = bestChromosome.fitness.hardViolationCount;
    progress.best.softPenalty = bestChromosome.fitness.softPenalty;

    progressCallback(progress);
    lastReportedPercentage = percentage;
}

void GeneticOptimizer::evaluatePopulation(
    std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    // This is intentionally the single population-evaluation boundary. Later it is the natural
    // place for parallelization without spreading threading logic through the optimizer.
    for (Chromosome& chromosome : population)
    {
        ChromosomeValidator::validate(chromosome, lessonInstances, scheduleSlots);
        chromosome.fitness = fitnessEvaluator.evaluate(
            chromosome, problem, lessonInstances, scheduleSlots);
    }
}

void GeneticOptimizer::sortPopulation(std::vector<Chromosome>& population)
{
    std::sort(population.begin(), population.end(), isBetter);
}

const Chromosome& GeneticOptimizer::selectByTournament(const std::vector<Chromosome>& population)
{
    const int tournamentSize = settings.tournamentSize;
    std::uniform_int_distribution<std::size_t> distribution(0, population.size() - 1);

    const Chromosome* winner = &population[distribution(randomEngine)];

    for (int index = 1; index < tournamentSize; ++index)
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
