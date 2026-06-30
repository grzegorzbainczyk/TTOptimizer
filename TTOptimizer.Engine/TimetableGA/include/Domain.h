#pragma once

#include <optional>
#include <string>
#include <vector>

using TeacherId = int;
using ClassGroupId = int;
using SubjectId = int;
using RoomId = int;
using LessonRequirementId = int;

// We use enum class instead of a plain enum to avoid accidental conversion to int.
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
    int slot{}; // 1 = first lesson, 2 = second lesson, etc.

    bool operator==(const TimeSlot& other) const
    {
        return day == other.day && slot == other.slot;
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

// This says WHAT must be planned, but not yet WHEN.
struct LessonRequirement
{
    LessonRequirementId id{};

    ClassGroupId classGroupId{};
    SubjectId subjectId{};
    TeacherId teacherId{};

    int weeklyCount{};
};

// This is one concrete planned lesson in the chromosome.
struct ScheduledLesson
{
    LessonRequirementId requirementId{};
    TimeSlot timeSlot{};
    std::optional<RoomId> roomId;
};

struct Chromosome
{
    std::vector<ScheduledLesson> lessons;
    double fitness = 0.0;
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
