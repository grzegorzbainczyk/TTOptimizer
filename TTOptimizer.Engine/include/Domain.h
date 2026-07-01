#pragma once

#include <optional>
#include <string>
#include <vector>
#include <cstddef>

using TeacherId = int;
using ClassGroupId = int;
using SubjectId = int;
using RoomId = int;
using LessonRequirementId = int;
using LessonInstanceId = int;

using LessonInstanceIndex = std::size_t;
using RoomTimeSlotIndex = std::size_t;

// Strongly typed representation of a weekday used in the timetable.
// We use enum class instead of a plain enum to avoid accidental conversion to int.
enum class DayOfWeek
{
    Monday = 0,
    Tuesday = 1,
    Wednesday = 2,
    Thursday = 3,
    Friday = 4
};

struct LessonInstance
{
    LessonInstanceId id{};
    LessonRequirementId requirementId{};
};

// Represents a single time position in the school week.
// Example: Monday, slot 1 means the first lesson on Monday.
struct TimeSlot
{
    DayOfWeek day{};
    int slot{}; // 1 = first lesson, 2 = second lesson, etc.

    bool operator==(const TimeSlot& other) const
    {
        return day == other.day && slot == other.slot;
    }
};

struct RoomTimeSlot
{
    RoomId roomId{};
    TimeSlot timeSlot{};
};

// Represents a weekly teaching requirement.
// This says WHAT must be planned, but not yet WHEN.
//
// Example:
// Class 1A must have Math with teacher Jan Kowalski 5 times per week.
struct LessonRequirement
{
    LessonRequirementId id{};

    ClassGroupId classGroupId{};
    SubjectId subjectId{};
    TeacherId teacherId{};

    int weeklyCount{};
};

// Represents a class group, for example 1A, 2B, or 8C.
// A class group has its own lesson limits and receives scheduled lessons.
struct ClassGroup
{
    ClassGroupId id{};
    std::string name;

    int maxLessonsPerDay{};
};

// Represents the full input problem definition for the timetable optimizer.
// It contains all entities and configuration needed to generate and evaluate schedules.
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

struct TimetableContext
{
    TimetableProblem problem;

    std::vector<LessonInstance> lessonInstances;
    std::vector<RoomTimeSlot> roomTimeSlots;
};

// Represents a school subject, for example Math, English, Physics, or PE.
// Subjects are referenced by teachers, rooms, and lesson requirements.
struct Subject
{
    SubjectId id{};
    std::string name;
};

// Represents a teacher who can teach selected subjects and may be unavailable
// during specific time slots.
struct Teacher
{
    TeacherId id{};
    std::string name;

    std::vector<SubjectId> subjects;
    std::vector<TimeSlot> unavailableSlots;
};

// Represents a physical room where lessons can take place.
// A room may have capacity limits and may allow only selected subjects.
struct Room
{
    RoomId id{};
    std::string name;

    int capacity{};
    std::vector<SubjectId> allowedSubjects;
};

// Represents one concrete scheduled lesson inside a chromosome.
// It assigns one lesson requirement to a specific time slot and optionally to a room.
//
// Example:
// Math for class 1A is scheduled on Monday, slot 2, in room 101.
struct ScheduledLesson
{
    LessonRequirementId requirementId{};
    TimeSlot timeSlot{};
    std::optional<RoomId> roomId;
};

// A chromosome represents one complete timetable solution.
//
// The chromosome is encoded as a vector of RoomTimeSlot indices.
// The size of the vector is equal to the number of lesson instances.
//
// genes[i] stores the index of the RoomTimeSlot assigned to lessonInstances[i].
//
// lessonInstances[i] defines WHAT is taught:
// subject, class group, teacher.
//
// roomTimeSlots[genes[i]] defines WHEN and WHERE it is taught:
// day, slot, room.
struct Chromosome
{
    // genes[i] contains the index of RoomTimeSlot assigned to lessonInstances[i].
    std::vector<RoomTimeSlotIndex> genes;

    double fitness = 0.0;
};

