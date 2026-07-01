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
#include "Utils.h"
#include "TimeTableViewBuilder.h"

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

    TimetableViewBuilder viewBuilder;

    std::vector<ScheduledLessonView> lessonViews = viewBuilder.build(
        scheduledLessons,
        problem);

    std::sort(
        lessonViews.begin(),
        lessonViews.end(),
        [](const ScheduledLessonView& left, const ScheduledLessonView& right)
        {
            if (left.day != right.day)
            {
                return static_cast<int>(left.day) < static_cast<int>(right.day);
            }

            if (left.lessonNumber != right.lessonNumber)
            {
                return left.lessonNumber < right.lessonNumber;
            }

            return left.roomName < right.roomName;
        });

    std::cout << "\nFull timetable:\n";

    for (const ScheduledLessonView& lesson : lessonViews)
    {
        std::cout
            << Utils::ToString(lesson.day)
            << ", lesson " << lesson.lessonNumber
            << ", room " << lesson.roomName
            << " | " << lesson.classGroupName
            << " | " << lesson.subjectName
            << " | " << lesson.teacherName
            << '\n';
    }


    return 0;
}