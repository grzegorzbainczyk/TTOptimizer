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
    StudentGroupConflict,
    StudentGroupImmediateBuildingChange,
    RoomConflict,

    TeacherGap,
    TeacherSingleLessonDay,
    TeacherImmediateBuildingChange,
    TeacherMaxConsecutiveLessons,
    TeacherMaxLessonsPerDay,

    ClassGroupGap,
    ClassGroupSingleLessonDay,
    ClassGroupMaxConsecutiveLessons,
    ClassGroupMaxLessonsPerDay,

    SubjectSpreadAcrossDays,
    SubjectMaxOccurrencesPerDay,
    SubjectPreferDoubleLessons,
    SubjectKeepSameRoomForDoubleLessons,
    SubjectPreferredRoom,
    SubjectAvoidDoubleLessons
};

struct ConstraintViolation
{
    ConstraintViolationType type{
        ConstraintViolationType::InvalidChromosome
    };

    int teacherId{};
    int classGroupId{};

    int studentGroupId{};
    int otherStudentGroupId{};

    int roomId{};
    int subjectId{};

    int dayIndex{ -1 };
    int slotIndex{ -1 };

    int occurrenceCount{ 1 };

    std::string message;
};