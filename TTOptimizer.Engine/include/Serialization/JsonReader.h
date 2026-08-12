#pragma once

#include <string>
#include <fstream>
#include <stdexcept>
#include <../External/nlohmann/json.hpp>
#include "Domain/TimetableModels.h"
#include "Domain/TimetableProblem.h"

using json = nlohmann::json;

class JsonReader
{
public:
    TimetableProblem readFromFile(const std::string& filePath) const
    {
        std::ifstream inputFile(filePath);

        if (!inputFile.is_open())
        {
            throw std::runtime_error(
                "Cannot open input JSON file: " + filePath);
        }

        json root;

        try
        {
            inputFile >> root;
        }
        catch (const std::exception& ex)
        {
            throw std::runtime_error(
                "Cannot parse input JSON file: " + filePath
                + ". Error: " + ex.what());
        }

        TimetableProblem problem;

        readOptimizationSettings(root, problem);

        problem.daysPerWeek = root.value("daysPerWeek", 5);
        problem.slotsPerDay = root.value("slotsPerDay", 8);

        readTeachers(root, problem);
        readClassGroups(root, problem);
        readSubjects(root, problem);
        readRooms(root, problem);
        readLessonRequirements(root, problem);

        readTimeSlotPreferences(root, problem);
        readTeacherSchedulingPreferences(root, problem);
        readClassGroupSchedulingPreferences(root, problem);

        return problem;
    }

private:
    static TimeSlotPreferenceType parsePreferenceType(
        const std::string& value)
    {
        if (value == "Preferred")
        {
            return TimeSlotPreferenceType::Preferred;
        }

        if (value == "NotPreferred")
        {
            return TimeSlotPreferenceType::NotPreferred;
        }

        if (value == "Unavailable")
        {
            return TimeSlotPreferenceType::Unavailable;
        }

        throw std::runtime_error(
            "Unknown time slot preference type: " + value);
    }

    static SchedulingPreferenceLevel parseSchedulingPreferenceLevel(
        const std::string& value)
    {
        if (value == "Disabled")
        {
            return SchedulingPreferenceLevel::Disabled;
        }

        if (value == "Low")
        {
            return SchedulingPreferenceLevel::Low;
        }

        if (value == "Medium")
        {
            return SchedulingPreferenceLevel::Medium;
        }

        if (value == "High")
        {
            return SchedulingPreferenceLevel::High;
        }

        if (value == "Hard")
        {
            return SchedulingPreferenceLevel::Hard;
        }

        throw std::runtime_error(
            "Unknown scheduling preference level: " + value);
    }

    static void readOptimizationSettings(
        const json& root,
        TimetableProblem& problem)
    {
        if (!root.contains("optimizationSettings"))
        {
            return;
        }

        const auto& settingsJson = root.at("optimizationSettings");
        auto& settings = problem.optimizationSettings;

        settings.populationSize = settingsJson.value(
            "populationSize", settings.populationSize);
        settings.generations = settingsJson.value(
            "generations", settings.generations);
        settings.eliteCount = settingsJson.value(
            "eliteCount", settings.eliteCount);
        settings.tournamentSize = settingsJson.value(
            "tournamentSize", settings.tournamentSize);
        settings.mutationAttempts = settingsJson.value(
            "mutationAttempts", settings.mutationAttempts);
        settings.mutationProbability = settingsJson.value(
            "mutationProbability", settings.mutationProbability);
        settings.randomSeed = settingsJson.value(
            "randomSeed", settings.randomSeed);
        settings.threadCount = settingsJson.value(
            "threadCount", settings.threadCount);
        settings.stopWhenPerfect = settingsJson.value(
            "stopWhenPerfect", settings.stopWhenPerfect);
        settings.stagnationGenerationLimit = settingsJson.value(
            "stagnationGenerationLimit",
            settings.stagnationGenerationLimit);
        settings.enableProgressLogging = settingsJson.value(
            "enableProgressLogging", settings.enableProgressLogging);
        settings.progressLogInterval = settingsJson.value(
            "progressLogInterval", settings.progressLogInterval);

        if (settingsJson.contains("penalties"))
        {
            const auto& penaltiesJson = settingsJson.at("penalties");

            settings.penalties.low = penaltiesJson.value(
                "low", settings.penalties.low);
            settings.penalties.medium = penaltiesJson.value(
                "medium", settings.penalties.medium);
            settings.penalties.high = penaltiesJson.value(
                "high", settings.penalties.high);
            settings.penalties.hard = penaltiesJson.value(
                "hard", settings.penalties.hard);
        }
    }

    static void readTeachers(const json& root, TimetableProblem& problem)
    {
        if (!root.contains("teachers") || !root["teachers"].is_array())
        {
            return;
        }

        for (const auto& item : root["teachers"])
        {
            Teacher teacher;
            teacher.id = item.value("id", 0);
            teacher.name = item.value("name", "");
            problem.teachers.push_back(teacher);
        }
    }

    static void readClassGroups(const json& root, TimetableProblem& problem)
    {
        if (!root.contains("classes") || !root["classes"].is_array())
        {
            return;
        }

        for (const auto& item : root["classes"])
        {
            ClassGroup classGroup;
            classGroup.id = item.value("id", 0);
            classGroup.name = item.value("name", "");
            problem.classGroups.push_back(classGroup);
        }
    }

    static void readSubjects(const json& root, TimetableProblem& problem)
    {
        if (!root.contains("subjects") || !root["subjects"].is_array())
        {
            return;
        }

        for (const auto& item : root["subjects"])
        {
            Subject subject;
            subject.id = item.value("id", 0);
            subject.name = item.value("name", "");
            problem.subjects.push_back(subject);
        }
    }

    static void readRooms(const json& root, TimetableProblem& problem)
    {
        if (!root.contains("rooms") || !root["rooms"].is_array())
        {
            return;
        }

        for (const auto& item : root["rooms"])
        {
            Room room;
            room.id = item.value("id", 0);
            room.name = item.value("name", "");
            room.capacity = item.value("capacity", 0);
            problem.rooms.push_back(room);
        }
    }

    static void readLessonRequirements(
        const json& root,
        TimetableProblem& problem)
    {
        if (!root.contains("lessonRequirements")
            || !root["lessonRequirements"].is_array())
        {
            return;
        }

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

    static void readTimeSlotPreferences(
        const json& root,
        TimetableProblem& problem)
    {
        if (root.contains("teacherTimeSlotPreferences")
            && root["teacherTimeSlotPreferences"].is_array())
        {
            for (const auto& item : root["teacherTimeSlotPreferences"])
            {
                TeacherTimeSlotPreference preference;
                preference.teacherId = item.value("teacherId", 0);
                preference.dayIndex = item.value("dayIndex", 0);
                preference.slotIndex = item.value("slotIndex", 0);
                preference.preferenceType = parsePreferenceType(
                    item.value("preferenceType", ""));

                problem.teacherTimeSlotPreferences.push_back(preference);
            }
        }

        if (root.contains("classGroupTimeSlotPreferences")
            && root["classGroupTimeSlotPreferences"].is_array())
        {
            for (const auto& item : root["classGroupTimeSlotPreferences"])
            {
                ClassGroupTimeSlotPreference preference;
                preference.classGroupId = item.value("classGroupId", 0);
                preference.dayIndex = item.value("dayIndex", 0);
                preference.slotIndex = item.value("slotIndex", 0);
                preference.preferenceType = parsePreferenceType(
                    item.value("preferenceType", ""));

                problem.classGroupTimeSlotPreferences.push_back(preference);
            }
        }

        if (root.contains("roomTimeSlotPreferences")
            && root["roomTimeSlotPreferences"].is_array())
        {
            for (const auto& item : root["roomTimeSlotPreferences"])
            {
                RoomTimeSlotPreference preference;
                preference.roomId = item.value("roomId", 0);
                preference.dayIndex = item.value("dayIndex", 0);
                preference.slotIndex = item.value("slotIndex", 0);
                preference.preferenceType = parsePreferenceType(
                    item.value("preferenceType", ""));

                problem.roomTimeSlotPreferences.push_back(preference);
            }
        }

        if (root.contains("subjectTimeSlotPreferences")
            && root["subjectTimeSlotPreferences"].is_array())
        {
            for (const auto& item : root["subjectTimeSlotPreferences"])
            {
                SubjectTimeSlotPreference preference;
                preference.subjectId = item.value("subjectId", 0);
                preference.dayIndex = item.value("dayIndex", 0);
                preference.slotIndex = item.value("slotIndex", 0);
                preference.preferenceType = parsePreferenceType(
                    item.value("preferenceType", ""));

                problem.subjectTimeSlotPreferences.push_back(preference);
            }
        }
    }


    static void readTeacherSchedulingPreferences(
        const json& root,
        TimetableProblem& problem)
    {
        if (!root.contains("teacherSchedulingPreferences")
            || !root["teacherSchedulingPreferences"].is_array())
        {
            return;
        }

        for (const auto& item :
            root["teacherSchedulingPreferences"])
        {
            TeacherSchedulingPreference preference;

            preference.teacherId =
                item.value("teacherId", 0);

            preference.minimizeGaps =
                parseSchedulingPreferenceLevel(
                    item.value("minimizeGaps", "Medium"));

            preference.avoidSingleLessonDay =
                parseSchedulingPreferenceLevel(
                    item.value(
                        "avoidSingleLessonDay",
                        "Low"));

            preference.maxConsecutiveLessons =
                parseSchedulingPreferenceLevel(
                    item.value(
                        "maxConsecutiveLessons",
                        "Medium"));

            preference.maxConsecutiveLessonsLimit =
                item.value(
                    "maxConsecutiveLessonsLimit",
                    4);

            preference.maxLessonsPerDay =
                parseSchedulingPreferenceLevel(
                    item.value(
                        "maxLessonsPerDay",
                        "Medium"));

            preference.maxLessonsPerDayLimit =
                item.value(
                    "maxLessonsPerDayLimit",
                    6);

            problem.teacherSchedulingPreferences.push_back(
                preference);
        }
    }


    static void readClassGroupSchedulingPreferences(
        const json& root,
        TimetableProblem& problem)
    {
        if (!root.contains("classGroupSchedulingPreferences")
            || !root["classGroupSchedulingPreferences"].is_array())
        {
            return;
        }

        for (const auto& item :
            root["classGroupSchedulingPreferences"])
        {
            ClassGroupSchedulingPreference preference;

            preference.classGroupId =
                item.value("classGroupId", 0);

            preference.minimizeGaps =
                parseSchedulingPreferenceLevel(
                    item.value("minimizeGaps", "Medium"));

            preference.avoidSingleLessonDay =
                parseSchedulingPreferenceLevel(
                    item.value(
                        "avoidSingleLessonDay",
                        "Disabled"));

            preference.maxConsecutiveLessons =
                parseSchedulingPreferenceLevel(
                    item.value(
                        "maxConsecutiveLessons",
                        "Medium"));

            preference.maxConsecutiveLessonsLimit =
                item.value(
                    "maxConsecutiveLessonsLimit",
                    6);

            preference.maxLessonsPerDay =
                parseSchedulingPreferenceLevel(
                    item.value(
                        "maxLessonsPerDay",
                        "High"));

            preference.maxLessonsPerDayLimit =
                item.value(
                    "maxLessonsPerDayLimit",
                    8);

            problem.classGroupSchedulingPreferences.push_back(
                preference);
        }
    }



};
