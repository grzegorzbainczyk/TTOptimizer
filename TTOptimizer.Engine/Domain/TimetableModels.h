#pragma once

#include <cstddef>
#include <string>
#include <vector>

#include "Evaluation/FitnessScore.h"

using TeacherId = int;
using ClassGroupId = int;
using StudentGroupId = int;
using SubjectId = int;
using RoomId = int;
using BuildingId = int;
using LessonRequirementId = int;
using LessonInstanceId = int;

using LessonInstanceIndex = std::size_t;
using ScheduleSlotIndex = std::size_t;

enum class DayOfWeek
{
    Monday = 0,
    Tuesday = 1,
    Wednesday = 2,
    Thursday = 3,
    Friday = 4,
    Saturday = 5,
    Sunday = 6
};

struct PenaltySettings
{
    int low = 10;
    int medium = 100;
    int high = 1'000;
    int hard = 1'000'000;
};

struct TimeSlot
{
    DayOfWeek day{};
    int lessonNumber{};

    bool operator==(const TimeSlot& other) const
    {
        return day == other.day
            && lessonNumber == other.lessonNumber;
    }
};

struct OptimizationSettings
{
    /*
     * Population settings.
     */

     // Number of chromosomes in each generation.
    int populationSize = 100;

    // Number of generations processed by the genetic algorithm.
    int generations = 10'000;

    // Number of the best chromosomes copied unchanged
    // to the next generation.
    int eliteCount = 5;

    // Number of chromosomes taking part in tournament selection.
    int tournamentSize = 3;

    /*
     * Mutation settings.
     */

     // Number of independently mutated candidates tested
     // when creating one child.
    int mutationAttempts = 5;

    // Probability that mutation is performed for a child.
    // Range: 0.0 to 1.0.
    double mutationProbability = 1.0;

    /*
     * Randomization and parallel execution.
     */

     // Seed used by random number generators.
    unsigned int randomSeed = 12'345;

    // Number of worker threads used by the optimizer.
    // Multithreaded evaluation will be implemented later.
    int threadCount = 1;

    /*
     * Stopping conditions.
     */

     // Stop when a feasible solution with zero soft penalty is found.
    bool stopWhenPerfect = true;

    // Stop when the best score has not improved for this many
    // consecutive generations. Zero disables this condition.
    int stagnationGenerationLimit = 0;

    /*
     * Diagnostics.
     */

     // Enables progress information written by the engine.
    bool enableProgressLogging = true;

    // Number of generations between progress messages.
    int progressLogInterval = 100;

    /*
     * Fitness evaluation settings.
     */

    PenaltySettings penalties;
};

struct Subject
{
    SubjectId id{};
    std::string name;
};

struct Teacher
{
    TeacherId id{};
    std::string name;
    std::vector<SubjectId> subjects;
    std::vector<TimeSlot> unavailableSlots;
};

struct ClassGroup
{
    ClassGroupId id{};
    std::string name;
    int maxLessonsPerDay{};
};


enum class StudentGroupType
{
    WholeClass,
    Subgroup,
    Combined,
    Individual
};

struct StudentGroup
{
    StudentGroupId id{};
    std::string name;
    StudentGroupType type{ StudentGroupType::WholeClass };
    std::vector<ClassGroupId> classGroupIds;
};

struct StudentGroupConflict
{
    StudentGroupId firstStudentGroupId{};
    StudentGroupId secondStudentGroupId{};
};

struct Room
{
    RoomId id{};
    std::string name;

    // 0 means that the room has no building assigned.
    BuildingId buildingId{};

    int capacity{};
    std::vector<SubjectId> allowedSubjects;
};

enum class LessonPriority
{
    Low = 0,
    Normal = 1,
    High = 2
};

struct LessonRequirement
{
    LessonRequirementId id{};
    ClassGroupId classGroupId{};
    StudentGroupId studentGroupId{};
    SubjectId subjectId{};
    TeacherId teacherId{};
    int weeklyCount{};
    bool isAdditional{};
    LessonPriority priority{ LessonPriority::Normal };
};

struct LessonInstance
{
    LessonInstanceId id{};
    LessonRequirementId requirementId{};
};

struct ScheduleSlot
{
    RoomId roomId{};
    TimeSlot timeSlot{};
};

struct Chromosome
{
    /*
     * Each gene represents one lesson instance.
     *
     * Gene index:
     *     index of a lesson instance in the lessonInstances collection.
     *
     * Gene value:
     *     index of the schedule slot assigned to that lesson instance.
     *
     * Therefore:
     *     genes[lessonInstanceIndex] = scheduleSlotIndex;
     */
    std::vector<ScheduleSlotIndex> genes;

    FitnessScore fitness;
};

struct ScheduledLesson
{
    LessonInstanceId lessonInstanceId{};
    LessonRequirementId requirementId{};

    ClassGroupId classGroupId{};
    StudentGroupId studentGroupId{};
    SubjectId subjectId{};
    TeacherId teacherId{};
    RoomId roomId{};

    TimeSlot timeSlot{};
};

struct ScheduledLessonView
{
    LessonInstanceId lessonInstanceId{};

    std::string classGroupName;
    std::string subjectName;
    std::string teacherName;
    std::string roomName;

    DayOfWeek day{};
    int lessonNumber{};
};