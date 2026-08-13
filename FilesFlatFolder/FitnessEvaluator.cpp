#include "FitnessEvaluator.h"
#include "Utils.h"

#include <algorithm>
#include <tuple>
#include <vector>

namespace
{
    struct TeacherSlotKey
    {
        TeacherId teacherId{};
        DayOfWeek day{};
        int slot{};

        bool operator<(const TeacherSlotKey& other) const
        {
            return std::tie(teacherId, day, slot) < std::tie(other.teacherId, other.day, other.slot);
        }
    };

    struct ClassSlotKey
    {
        ClassGroupId classGroupId{};
        DayOfWeek day{};
        int slot{};

        bool operator<(const ClassSlotKey& other) const
        {
            return std::tie(classGroupId, day, slot) < std::tie(other.classGroupId, other.day, other.slot);
        }
    };
}

double FitnessEvaluator::evaluate(const Chromosome& chromosome, const TimetableProblem& problem) const
{
    const int teacherCollisions = countTeacherCollisions(chromosome, problem);
    const int classGroupCollisions = countClassGroupCollisions(chromosome, problem);
    const int unavailableViolations = countTeacherUnavailableViolations(chromosome, problem);

    // Lower penalty means better chromosome.
    // Hard constraints receive high penalties.
    const int penalty =
        teacherCollisions * 1000 +
        classGroupCollisions * 1000 +
        unavailableViolations * 1000;

    // Fitness is higher when penalty is lower.
    return 1.0 / (1.0 + penalty);
}

int FitnessEvaluator::countTeacherCollisions(const Chromosome& chromosome, const TimetableProblem& problem) const
{
    std::vector<TeacherSlotKey> keys;
    keys.reserve(chromosome.lessons.size());

    for (const auto& lesson : chromosome.lessons)
    {
        const auto& requirement = findRequirement(problem, lesson.requirementId);
        keys.push_back({ requirement.teacherId, lesson.timeSlot.day, lesson.timeSlot.slot });
    }

    std::sort(keys.begin(), keys.end());

    int collisions = 0;
    for (std::size_t i = 1; i < keys.size(); ++i)
    {
        if (!(keys[i - 1] < keys[i]) && !(keys[i] < keys[i - 1]))
        {
            ++collisions;
        }
    }

    return collisions;
}

int FitnessEvaluator::countClassGroupCollisions(const Chromosome& chromosome, const TimetableProblem& problem) const
{
    std::vector<ClassSlotKey> keys;
    keys.reserve(chromosome.lessons.size());

    for (const auto& lesson : chromosome.lessons)
    {
        const auto& requirement = findRequirement(problem, lesson.requirementId);
        keys.push_back({ requirement.classGroupId, lesson.timeSlot.day, lesson.timeSlot.slot });
    }

    std::sort(keys.begin(), keys.end());

    int collisions = 0;
    for (std::size_t i = 1; i < keys.size(); ++i)
    {
        if (!(keys[i - 1] < keys[i]) && !(keys[i] < keys[i - 1]))
        {
            ++collisions;
        }
    }

    return collisions;
}

int FitnessEvaluator::countTeacherUnavailableViolations(
    const Chromosome& chromosome,
    const TimetableProblem& problem) const
{
    int violations = 0;

    for (const auto& lesson : chromosome.lessons)
    {
        const auto& requirement = findRequirement(problem, lesson.requirementId);
        const auto& teacher = findTeacher(problem, requirement.teacherId);

        const bool unavailable = std::any_of(
            teacher.unavailableSlots.begin(),
            teacher.unavailableSlots.end(),
            [&lesson](const TimeSlot& unavailableSlot)
            {
                return unavailableSlot == lesson.timeSlot;
            });

        if (unavailable)
        {
            ++violations;
        }
    }

    return violations;
}
