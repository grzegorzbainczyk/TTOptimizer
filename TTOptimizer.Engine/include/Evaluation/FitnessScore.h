#pragma once

#include <string>
#include <utility>
#include <vector>

enum class ConstraintViolationType
{
    InvalidChromosome,
    InvalidScheduleSlot,

    TeacherUnavailable,
    ClassGroupUnavailable,
    RoomUnavailable,

    TeacherConflict,
    ClassGroupConflict,
    RoomConflict
};

struct ConstraintViolation
{
    ConstraintViolationType type{
        ConstraintViolationType::InvalidChromosome
    };

    int teacherId{};
    int classGroupId{};
    int roomId{};

    int dayIndex{ -1 };
    int slotIndex{ -1 };

    int occurrenceCount{ 1 };

    std::string message;
};

struct FitnessScore
{
    int hardViolationCount{};
    double softPenalty{};

    std::vector<ConstraintViolation> violations;

    bool isFeasible() const
    {
        return hardViolationCount == 0;
    }

    bool isBetterThan(
        const FitnessScore& other) const
    {
        /*
         * Hard constraints are always more important
         * than soft constraints.
         */
        if (hardViolationCount !=
            other.hardViolationCount)
        {
            return hardViolationCount <
                other.hardViolationCount;
        }

        return softPenalty <
            other.softPenalty;
    }

    void addHardViolation(
        ConstraintViolation violation,
        int count = 1)
    {
        if (count <= 0)
        {
            return;
        }

        hardViolationCount += count;
        violation.occurrenceCount = count;

        violations.push_back(std::move(violation));
    }

    void addSoftPenalty(double penalty)
    {
        if (penalty > 0.0)
        {
            softPenalty += penalty;
        }
    }
};