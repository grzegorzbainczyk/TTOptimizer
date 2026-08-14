#include "Optimization/GeneticOptimizer.h"

#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <utility>

#include "Evaluation/Validation/ChromosomeValidator.h"

GeneticOptimizer::GeneticOptimizer(
    const OptimizationSettings& settings,
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
        throw std::invalid_argument(
            "Population size must be greater than zero.");
    }

    std::vector<Chromosome> population;
    population.reserve(static_cast<std::size_t>(populationSize));

    // Build independent random timetable candidates.
    // Every chromosome is validated and evaluated immediately so the returned
    // population already contains usable fitness values.
    for (int index = 0; index < populationSize; ++index)
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
    // Keep this method at the level of the genetic algorithm itself.
    // Detailed operations such as validation, mutation attempts and elitism
    // are delegated to smaller methods so this function can be read almost
    // like pseudocode.
    validateOptimizationInput(
        initialPopulation,
        lessonInstances,
        scheduleSlots);

    std::vector<Chromosome> population =
        initializePopulation(
            std::move(initialPopulation),
            problem,
            lessonInstances,
            scheduleSlots);

    // The population returned by initializePopulation() is sorted, therefore
    // the first chromosome is the best solution in the initial generation.
    Chromosome bestChromosome = population.front();

    int bestFoundAtGeneration = 0;
    int lastReportedPercentage = -1;

    reportInitialState(bestChromosome);

    reportProgress(
        0,
        settings.generations,
        bestFoundAtGeneration,
        bestChromosome,
        lastReportedPercentage);

    // Each iteration creates one complete generation.
    // createNextGeneration() guarantees that the returned population is sorted.
    for (int generation = 1;
        generation <= settings.generations;
        ++generation)
    {
        population =
            createNextGeneration(
                population,
                problem,
                lessonInstances,
                scheduleSlots);

        updateBestChromosome(
            population,
            bestChromosome,
            generation,
            bestFoundAtGeneration);

        reportProgress(
            generation,
            settings.generations,
            bestFoundAtGeneration,
            bestChromosome,
            lastReportedPercentage);

        if (shouldStopEarly(bestChromosome))
        {
            reportPerfectSolution(generation);
            break;
        }
    }

    // Recalculate fitness before returning the result.
    // This provides a final consistency check and guarantees that the returned
    // fitness represents the current chromosome and the current rule set.
    bestChromosome.fitness =
        fitnessEvaluator.evaluate(
            bestChromosome,
            problem,
            lessonInstances,
            scheduleSlots);

    return bestChromosome;
}

void GeneticOptimizer::validateOptimizationInput(
    const std::vector<Chromosome>& initialPopulation,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    if (settings.generations <= 0)
    {
        throw std::invalid_argument(
            "Generations must be greater than zero.");
    }

    if (initialPopulation.empty())
    {
        throw std::invalid_argument(
            "Initial population cannot be empty.");
    }

    if (scheduleSlots.empty() && !lessonInstances.empty())
    {
        throw std::invalid_argument(
            "Schedule slots cannot be empty when lesson instances exist.");
    }

    const int populationSize =
        static_cast<int>(initialPopulation.size());

    if (settings.eliteCount < 0
        || settings.eliteCount >= populationSize)
    {
        throw std::invalid_argument(
            "Elite count must be non-negative and smaller than population size.");
    }

    if (settings.tournamentSize <= 0
        || settings.tournamentSize > populationSize)
    {
        throw std::invalid_argument(
            "Tournament size must be between 1 and population size.");
    }

    if (settings.mutationAttempts < 0)
    {
        throw std::invalid_argument(
            "Mutation attempts cannot be negative.");
    }

    if (settings.mutationProbability < 0.0
        || settings.mutationProbability > 1.0)
    {
        throw std::invalid_argument(
            "Mutation probability must be between 0.0 and 1.0.");
    }
}

std::vector<Chromosome> GeneticOptimizer::initializePopulation(
    std::vector<Chromosome> population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    // Ensure that every chromosome has a fitness value calculated against
    // exactly the problem data used by this optimization run.
    evaluatePopulation(
        population,
        problem,
        lessonInstances,
        scheduleSlots);

    // Contract used by the rest of GeneticOptimizer:
    // every population leaving this method is ordered from best to worst.
    sortPopulation(population);

    return population;
}

std::vector<Chromosome> GeneticOptimizer::createNextGeneration(
    const std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    const std::size_t populationSize =
        population.size();

    std::vector<Chromosome> nextPopulation;
    nextPopulation.reserve(populationSize);

    // Elitism protects the strongest chromosomes from being lost through
    // random tournament selection or unsuccessful mutation.
    copyElite(population, nextPopulation);

    // Fill all remaining positions with children produced from parents selected
    // by tournament selection. A child may be an unchanged parent or the best
    // result found during several mutation attempts.
    while (nextPopulation.size() < populationSize)
    {
        Chromosome child =
            createChild(
                population,
                problem,
                lessonInstances,
                scheduleSlots);

        nextPopulation.push_back(
            std::move(child));
    }

    // Keep one simple invariant throughout the optimizer:
    // a completed generation is always sorted from best to worst.
    sortPopulation(nextPopulation);

    return nextPopulation;
}

void GeneticOptimizer::copyElite(
    const std::vector<Chromosome>& population,
    std::vector<Chromosome>& nextPopulation) const
{
    for (int index = 0;
        index < settings.eliteCount;
        ++index)
    {
        nextPopulation.push_back(
            population[
                static_cast<std::size_t>(index)]);
    }
}

Chromosome GeneticOptimizer::createChild(
    const std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    const Chromosome& parent =
        selectByTournament(population);

    // If mutation is skipped, the selected parent simply survives as a child.
    std::bernoulli_distribution mutationDistribution(
        settings.mutationProbability);

    if (!mutationDistribution(randomEngine))
    {
        return parent;
    }

    return findBestMutation(
        parent,
        problem,
        lessonInstances,
        scheduleSlots);
}

Chromosome GeneticOptimizer::findBestMutation(
    const Chromosome& parent,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    // Start with the parent as the baseline.
    // A mutation is accepted only if it improves this baseline.
    Chromosome bestCandidate = parent;

    for (int attempt = 0;
        attempt < settings.mutationAttempts;
        ++attempt)
    {
        // Every attempt starts from the same parent rather than from the
        // previous mutation. This means the attempts are independent candidate
        // mutations and we keep only the best one.
        Chromosome candidate = parent;

        mutator.mutateAssignment(
            candidate,
            scheduleSlots.size());

        // Mutation changes the timetable assignment, therefore the candidate
        // must be evaluated before it can be compared with the current best.
        candidate.fitness =
            fitnessEvaluator.evaluate(
                candidate,
                problem,
                lessonInstances,
                scheduleSlots);

        if (candidate.fitness.isBetterThan(
            bestCandidate.fitness))
        {
            bestCandidate =
                std::move(candidate);
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
    // createNextGeneration() returns a sorted population, so front() is the
    // best chromosome produced by the current generation.
    const Chromosome& generationBest =
        population.front();

    if (!generationBest.fitness.isBetterThan(
        bestChromosome.fitness))
    {
        return;
    }

    bestChromosome = generationBest;
    bestFoundAtGeneration = generation;

    std::cerr << "Generation: "
        << generation
        << ", new best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';
}

bool GeneticOptimizer::shouldStopEarly(
    const Chromosome& bestChromosome) const
{
    // A feasible chromosome with zero soft penalty cannot be improved according
    // to the current fitness model, so continuing would only consume CPU time.
    return settings.stopWhenPerfect
        && bestChromosome.fitness.isFeasible()
        && bestChromosome.fitness.softPenalty == 0.0;
}

void GeneticOptimizer::reportInitialState(
    const Chromosome& bestChromosome)
{
    std::cerr << "Initial population best: hard violations = "
        << bestChromosome.fitness.hardViolationCount
        << ", soft penalty = "
        << bestChromosome.fitness.softPenalty
        << '\n';
}

void GeneticOptimizer::reportPerfectSolution(
    int generation)
{
    std::cerr
        << "Perfect solution found in generation "
        << generation
        << ".\n";
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

    const int percentage =
        generation * 100 / totalGenerations;

    if (percentage == lastReportedPercentage)
    {
        return;
    }

    OptimizationProgress progress;
    progress.generation = generation;
    progress.totalGenerations = totalGenerations;
    progress.percentage = percentage;
    progress.bestFoundAtGeneration =
        bestFoundAtGeneration;

    progress.best.hardViolationCount =
        bestChromosome.fitness.hardViolationCount;

    progress.best.softPenalty =
        bestChromosome.fitness.softPenalty;

    progressCallback(progress);

    lastReportedPercentage = percentage;
}

void GeneticOptimizer::evaluatePopulation(
    std::vector<Chromosome>& population,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots)
{
    // Fitness evaluation is currently sequential.
    // This method is intentionally kept as the single population-evaluation
    // boundary because it is the natural place for later parallelization.
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

const Chromosome& GeneticOptimizer::selectByTournament(
    const std::vector<Chromosome>& population)
{
    const int tournamentSize =
        settings.tournamentSize;

    std::uniform_int_distribution<std::size_t> distribution(
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