#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <cmath>
#include "external/nlohmann/json.hpp"
#include "TTOptimizer.Engine.h"
#include <SampleTimetableData.h>
#include <ChromosomeFactory.h>
#include <FitnessEvaluator.h>

using json = nlohmann::json;

struct Task
{
    int id{};
    std::string name;
    int duration{};
};

int CalculateEstimatedScheduleLength(const std::vector<Task>& tasks, int resources)
{
    int totalDuration = 0;

    for (const auto& task : tasks)
    {
        totalDuration += task.duration;
    }

    if (resources <= 0)
    {
        throw std::runtime_error("Resources must be greater than zero.");
    }

    return static_cast<int>(std::ceil(static_cast<double>(totalDuration) / resources));
}


void showResults(Chromosome& chromosome, double fitness)
{
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
}

int runDemoMode()
{
    TimetableProblem problem;
    problem = CreateLargeSampleTimetableProblem();

    //GenerateTestProblem(problem);

    ChromosomeFactory factory;
    Chromosome chromosome = factory.createRandom(problem);

    FitnessEvaluator evaluator;
    double fitness = evaluator.evaluate(chromosome, problem);

    showResults(chromosome, fitness);

	return 0;
}


int main(int argc, char* argv[])
{

    if (argc >= 2)
    {
        return runJsonMode(argv[1]);   // tryb dla ASP.NET
    }

    return runDemoMode();              // tryb konsolowy/testowy
}


void GenerateTestProblem(TimetableProblem& problem)
{
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

    problem.rooms.push_back({ 1, "101", 30,{} });
    problem.rooms.push_back({ 2, "102", 30,{} });
    problem.rooms.push_back({ 3, "Physics Lab", 20,{ 3 } });

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
}

int runJsonMode(const std::string& inputFilePath)
{
    try
    {
      
        //std::string inputFilePath = argv[1];

        std::ifstream inputFile(inputFilePath);

        if (!inputFile.is_open())
        {
            json errorResponse =
            {
                { "success", false },
                { "message", "Cannot open input JSON file." },
                { "path", inputFilePath }
            };

            std::cerr << errorResponse.dump(4) << std::endl;
            return 2;
        }

        json inputJson;
        inputFile >> inputJson;

        int resources = inputJson.value("resources", 0);

        std::vector<Task> tasks;

        for (const auto& taskJson : inputJson["tasks"])
        {
            Task task;
            task.id = taskJson.value("id", 0);
            task.name = taskJson.value("name", "");
            task.duration = taskJson.value("duration", 0);

            tasks.push_back(task);
        }

        int estimatedScheduleLength = CalculateEstimatedScheduleLength(tasks, resources);

        json result =
        {
            { "success", true },
            { "taskCount", tasks.size() },
            { "resources", resources },
            { "estimatedScheduleLength", estimatedScheduleLength },
            { "message", "Optimization completed" }
        };

        std::cout << result.dump(4) << std::endl;

        return 0;
    }
    catch (const std::exception& ex)
    {
        json errorResponse =
        {
            { "success", false },
            { "message", ex.what() }
        };

        std::cerr << errorResponse.dump(4) << std::endl;
        return 10;
    }
}
