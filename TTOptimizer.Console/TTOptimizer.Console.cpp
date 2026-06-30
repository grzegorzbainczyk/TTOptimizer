#include <iostream>

#include "../TTOptimizer.Engine/include/Domain.h"
#include "../TTOptimizer.Engine/include/ChromosomeFactory.h"
#include "../TTOptimizer.Engine/include/FitnessEvaluator.h"

int main()
{
    TimetableProblem problem;

    problem.subjects.push_back({ 1, "Mathematics" });
    problem.subjects.push_back({ 2, "English" });
    problem.subjects.push_back({ 3, "Physics" });

    problem.classGroups.push_back({ 1, "1A", 7 });
    problem.classGroups.push_back({ 2, "1B", 7 });

    problem.teachers.push_back({
        1,
        "Jan Kowalski",
        { 1, 3 },
        {
            { DayOfWeek::Wednesday, 1 },
            { DayOfWeek::Wednesday, 2 }
        }
        });

    problem.teachers.push_back({
        2,
        "Anna Nowak",
        { 2 },
        {
            { DayOfWeek::Friday, 7 },
            { DayOfWeek::Friday, 8 }
        }
        });

    problem.rooms.push_back({ 1, "101", 30, {} });
    problem.rooms.push_back({ 2, "102", 30, {} });
    problem.rooms.push_back({ 3, "Physics Lab", 20, { 3 } });

    problem.lessonRequirements.push_back({
        1,
        1, // class 1A
        1, // mathematics
        1, // Jan Kowalski
        4  // 4 lessons per week
        });

    problem.lessonRequirements.push_back({
        2,
        1, // class 1A
        2, // English
        2, // Anna Nowak
        3
        });

    problem.lessonRequirements.push_back({
        3,
        2, // class 1B
        3, // Physics
        1, // Jan Kowalski
        2
        });

    ChromosomeFactory factory;
    Chromosome chromosome = factory.createRandom(problem);

    FitnessEvaluator evaluator;
    double fitness = evaluator.evaluate(chromosome, problem);

    std::cout << "Generated chromosome\n";
    std::cout << "Lessons count: " << chromosome.lessons.size() << '\n';
    std::cout << "Fitness: " << fitness << "\n\n";

    for (const auto& lesson : chromosome.lessons)
    {
        std::cout
            << "RequirementId: " << lesson.requirementId
            << ", day: " << static_cast<int>(lesson.timeSlot.day)
            << ", slot: " << lesson.timeSlot.slot;

        if (lesson.roomId.has_value())
        {
            std::cout << ", roomId: " << lesson.roomId.value();
        }
        else
        {
            std::cout << ", roomId: none";
        }

        std::cout << '\n';
    }

    return 0;
}