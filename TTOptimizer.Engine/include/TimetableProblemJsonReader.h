#pragma once

#include <string>
#include <../External/nlohmann/json.hpp>
#include "Domain/TimetableModels.h"

#include <fstream>
#include <stdexcept>
using json = nlohmann::json;

class TimetableProblemJsonReader
{
public:
    TimetableProblem readFromFile(const std::string& filePath) const
    {
        std::ifstream inputFile(filePath);

        if (!inputFile.is_open())
        {
            throw std::runtime_error("Cannot open input JSON file: " + filePath);
        }

        json root;

        try
        {
            inputFile >> root;
        }
        catch (const std::exception& ex)
        {
            throw std::runtime_error(
                "Cannot parse input JSON file: " + filePath + ". Error: " + ex.what()
            );
        }

        TimetableProblem problem;

        if (root.contains("optimizationSettings"))
        {
            const auto& settingsJson =
                root.at("optimizationSettings");

            problem.optimizationSettings.iterations =
                settingsJson.value(
                    "iterations",
                    problem.optimizationSettings.iterations);

            problem.optimizationSettings.randomSeed =
                settingsJson.value(
                    "randomSeed",
                    problem.optimizationSettings.randomSeed);
        }


        problem.daysPerWeek = root.value("daysPerWeek", 5);
        problem.slotsPerDay = root.value("slotsPerDay", 8);


        if (root.contains("teachers") && root["teachers"].is_array())
        {
            for (const auto& item : root["teachers"])
            {
                Teacher teacher;
                teacher.id = item.value("id", 0);
                teacher.name = item.value("name", "");

                problem.teachers.push_back(teacher);
            }
        }

        if (root.contains("classes") && root["classes"].is_array())
        {
            for (const auto& item : root["classes"])
            {
                ClassGroup classGroup;
                classGroup.id = item.value("id", 0);
                classGroup.name = item.value("name", "");

                problem.classGroups.push_back(classGroup);
            }
        }

        if (root.contains("subjects") && root["subjects"].is_array())
        {
            for (const auto& item : root["subjects"])
            {
                Subject subject;
                subject.id = item.value("id", 0);
                subject.name = item.value("name", "");

                problem.subjects.push_back(subject);
            }
        }

        if (root.contains("rooms") && root["rooms"].is_array())
        {
            for (const auto& item : root["rooms"])
            {
                Room room;
                room.id = item.value("id", 0);
                room.name = item.value("name", "");
                room.capacity = item.value("capacity", 0);

                problem.rooms.push_back(room);
            }
        }

        if (root.contains("lessonRequirements") && root["lessonRequirements"].is_array())
        {
            for (const auto& item : root["lessonRequirements"])
            {
                LessonRequirement requirement;
                requirement.id = item.value("id", 0);
                requirement.teacherId = item.value("teacherId", 0);
                requirement.classGroupId = item.value("classGroupId", 0);
                requirement.subjectId = item.value("subjectId", 0);
                requirement.weeklyCount = item.value("lessonsPerWeek", 0);

                problem.lessonRequirements.push_back(requirement);
            }
        }

        return problem;
    }
};