#pragma once

#include <string>
#include <fstream>
#include <stdexcept>
#include <../External/nlohmann/json.hpp>
#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"

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


        if (root.contains("teacherUnavailabilities")
            && root["teacherUnavailabilities"].is_array())
        {
            for (const auto& item : root["teacherUnavailabilities"])
            {
                TeacherUnavailability unavailability;

                unavailability.teacherId =
                    item.value("teacherId", 0);

                unavailability.dayIndex =
                    item.value("dayIndex", 0);

                unavailability.slotIndex =
                    item.value("slotIndex", 0);

                problem.teacherUnavailabilities.push_back(unavailability);
            }
        }

        if (root.contains("classGroupUnavailabilities")
            && root["classGroupUnavailabilities"].is_array())
        {
            for (const auto& item : root["classGroupUnavailabilities"])
            {
                ClassGroupUnavailability unavailability;

                unavailability.classGroupId =
                    item.value("classGroupId", 0);

                unavailability.dayIndex =
                    item.value("dayIndex", 0);

                unavailability.slotIndex =
                    item.value("slotIndex", 0);

                problem.classGroupUnavailabilities.push_back(unavailability);
            }
        }

        if (root.contains("roomUnavailabilities")
            && root["roomUnavailabilities"].is_array())
        {
            for (const auto& item : root["roomUnavailabilities"])
            {
                RoomUnavailability unavailability;

                unavailability.roomId =
                    item.value("roomId", 0);

                unavailability.dayIndex =
                    item.value("dayIndex", 0);

                unavailability.slotIndex =
                    item.value("slotIndex", 0);

                problem.roomUnavailabilities.push_back(unavailability);
            }
        }

        return problem;
    }
};