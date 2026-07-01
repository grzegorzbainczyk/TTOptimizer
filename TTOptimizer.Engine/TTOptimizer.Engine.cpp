#include <iostream>
#include <vector>

#include "TimetableModels.h"
#include "test1.h"

#include "ScheduleSlotGenerator.h"
#include "LessonInstanceGenerator.h"
#include "ChromosomeFactory.h"
#include "FitnessEvaluator.h"
#include "SimpleOptimizer.h"

int main()
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

    FitnessEvaluator fitnessEvaluator;

    initialChromosome.penalty = fitnessEvaluator.evaluate(
        initialChromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    std::cout << "Schedule slots: " << scheduleSlots.size() << '\n';
    std::cout << "Lesson instances: " << lessonInstances.size() << '\n';
    std::cout << "Initial penalty before optimizer: "
        << initialChromosome.penalty << '\n';

    SimpleOptimizer optimizer(456);

    Chromosome bestChromosome = optimizer.optimize(
        initialChromosome,
        problem,
        lessonInstances,
        scheduleSlots,
        10000);

    std::cout << "Best penalty after optimizer: "
        << bestChromosome.penalty << '\n';

    return 0;
}