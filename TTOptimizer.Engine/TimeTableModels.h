#pragma once

#include <cstddef>
#include <optional>
#include <string>
#include <vector>

using TeacherId = int;
using ClassGroupId = int;
using SubjectId = int;
using RoomId = int;
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
    Friday = 4
};

struct TimeSlot
{
    DayOfWeek day{};
    int lessonNumber{}; // 1 = first lesson of the day

    bool operator==(const TimeSlot& other) const
    {
        return day == other.day
            && lessonNumber == other.lessonNumber;
    }
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

struct Room
{
    RoomId id{};
    std::string name;
    int capacity{};
    std::vector<SubjectId> allowedSubjects;
};

struct LessonRequirement
{
    LessonRequirementId id{};
    ClassGroupId classGroupId{};
    SubjectId subjectId{};
    TeacherId teacherId{};
    int weeklyCount{};
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
    std::vector<std::optional<LessonInstanceIndex>> genes;
    double penalty = 0.0;
};

struct TimetableProblem
{
    std::vector<Teacher> teachers;
    std::vector<ClassGroup> classGroups;
    std::vector<Subject> subjects;
    std::vector<Room> rooms;
    std::vector<LessonRequirement> lessonRequirements;

    int daysPerWeek = 5;
    int slotsPerDay = 8;
};
