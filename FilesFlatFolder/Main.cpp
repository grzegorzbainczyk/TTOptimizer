#include "ChromosomeFactory.h"
#include "Domain.h"
#include "FitnessEvaluator.h"
#include "Utils.h"

#include <iostream>

namespace
{
    TimetableProblem createSampleProblem()
    {
        TimetableProblem problem;
        problem.daysPerWeek = 5;
        problem.slotsPerDay = 8;

        problem.subjects = {
            { 1, "Mathematics" },
            { 2, "English" },
            { 3, "Physics" }
        };

        problem.teachers = {
            { 1, "Jan Kowalski", { 1, 3 }, { { DayOfWeek::Wednesday, 1 }, { DayOfWeek::Wednesday, 2 } } },
            { 2, "Anna Nowak", { 2 }, { { DayOfWeek::Friday, 7 }, { DayOfWeek::Friday, 8 } } }
        };

        problem.classGroups = {
            { 1, "1A", 7 },
            { 2, "1B", 7 }
        };

        problem.rooms = {
            { 1, "101", 30, {} },
            { 2, "102", 30, {} },
            { 3, "Physics Lab", 20, { 3 } }
        };

        problem.lessonRequirements = {
            { 1, 1, 1, 1, 4 }, // 1A, Mathematics, Jan, 4 times per week
            { 2, 1, 2, 2, 3 }, // 1A, English, Anna, 3 times per week
            { 3, 2, 1, 1, 4 }, // 1B, Mathematics, Jan, 4 times per week
            { 4, 2, 2, 2, 3 }, // 1B, English, Anna, 3 times per week
            { 5, 2, 3, 1, 2 }  // 1B, Physics, Jan, 2 times per week
        };

        return problem;
    }

    void printChromosome(const Chromosome& chromosome, const TimetableProblem& problem)
    {
        for (const auto& lesson : chromosome.lessons)
        {
            const auto& requirement = findRequirement(problem, lesson.requirementId);
            const auto& subject = findSubject(problem, requirement.subjectId);
            const auto& teacher = findTeacher(problem, requirement.teacherId);
            const auto& classGroup = findClassGroup(problem, requirement.classGroupId);

            std::cout
                << toString(lesson.timeSlot.day)
                << ", slot " << lesson.timeSlot.slot
                << " | class " << classGroup.name
                << " | " << subject.name
                << " | teacher: " << teacher.name;

            if (lesson.roomId.has_value())
            {
                std::cout << " | room id: " << *lesson.roomId;
            }
            else
            {
                std::cout << " | room: not assigned";
            }

            std::cout << '\n';
        }
    }
}

int main()
{
    try
    {
        const TimetableProblem problem = createSampleProblem();

        ChromosomeFactory factory;
        FitnessEvaluator evaluator;

        Chromosome chromosome = factory.createRandom(problem);
        chromosome.fitness = evaluator.evaluate(chromosome, problem);

        std::cout << "Generated timetable candidate\n";
        std::cout << "Fitness: " << chromosome.fitness << "\n\n";

        printChromosome(chromosome, problem);
    }
    catch (const std::exception& ex)
    {
        std::cerr << "Error: " << ex.what() << '\n';
        return 1;
    }

    return 0;
}
