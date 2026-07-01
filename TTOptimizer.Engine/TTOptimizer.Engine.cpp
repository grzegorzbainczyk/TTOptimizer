#include <iostream>
#include <vector>

#include "TimetableModels.h"
#include "test1.h"

#include "ScheduleSlotGenerator.h"
#include "LessonInstanceGenerator.h"
#include "ChromosomeFactory.h"
#include "FitnessEvaluator.h"
#include "SimpleOptimizer.h"
#include "TimeTableDecoder.h"

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

    TimetableDecoder decoder;

    std::vector<ScheduledLesson> scheduledLessons = decoder.decode(
        bestChromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    std::cout << "Best penalty: " << bestChromosome.penalty << '\n';
    std::cout << "Scheduled lessons: " << scheduledLessons.size() << '\n';

    for (const ScheduledLesson& lesson : scheduledLessons)
    {
        std::cout
            << "LessonInstanceId: " << lesson.lessonInstanceId
            << ", classGroupId: " << lesson.classGroupId
            << ", subjectId: " << lesson.subjectId
            << ", teacherId: " << lesson.teacherId
            << ", roomId: " << lesson.roomId
            << ", day: " << static_cast<int>(lesson.timeSlot.day)
            << ", lessonNumber: " << lesson.timeSlot.lessonNumber
            << '\n';
    }

    return 0;
}