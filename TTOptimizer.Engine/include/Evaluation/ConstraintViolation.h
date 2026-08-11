#pragma once

#include <string>

enum class ConstraintViolationType
{
    InvalidChromosome,
    InvalidScheduleSlot,

    TeacherUnavailable,
    ClassGroupUnavailable,
    RoomUnavailable,
    SubjectUnavailable,

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
    int subjectId{};

    int dayIndex{ -1 };
    int slotIndex{ -1 };

    int occurrenceCount{ 1 };

    std::string message;
};
