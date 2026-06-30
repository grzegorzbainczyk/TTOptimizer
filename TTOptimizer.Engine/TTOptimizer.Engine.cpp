#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <cmath>
#include "external/nlohmann/json.hpp"

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

int main(int argc, char* argv[])
{
    try
    {
        if (argc < 2)
        {
            json errorResponse =
            {
                { "success", false },
                { "message", "Missing input JSON file path." }
            };

            std::cerr << errorResponse.dump(4) << std::endl;
            return 1;
        }

        std::string inputFilePath = argv[1];

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