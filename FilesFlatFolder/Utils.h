#pragma once

#include "Domain.h"

#include <algorithm>
#include <stdexcept>
#include <string>

inline std::string toString(DayOfWeek day)
{
    switch (day)
    {
    case DayOfWeek::Monday: return "Monday";
    case DayOfWeek::Tuesday: return "Tuesday";
    case DayOfWeek::Wednesday: return "Wednesday";
    case DayOfWeek::Thursday: return "Thursday";
    case DayOfWeek::Friday: return "Friday";
    }

    return "Unknown";
}

inline const LessonRequirement& findRequirement(
    const TimetableProblem& problem,
    LessonRequirementId requirementId)
{
    auto it = std::find_if(
        problem.lessonRequirements.begin(),
        problem.lessonRequirements.end(),
        [requirementId](const LessonRequirement& requirement)
        {
            return requirement.id == requirementId;
        });

    if (it == problem.lessonRequirements.end())
    {
        throw std::runtime_error("LessonRequirement not found: " + std::to_string(requirementId));
    }

    return *it;
}

inline const Subject& findSubject(const TimetableProblem& problem, SubjectId subjectId)
{
    auto it = std::find_if(
        problem.subjects.begin(),
        problem.subjects.end(),
        [subjectId](const Subject& subject)
        {
            return subject.id == subjectId;
        });

    if (it == problem.subjects.end())
    {
        throw std::runtime_error("Subject not found: " + std::to_string(subjectId));
    }

    return *it;
}

inline const Teacher& findTeacher(const TimetableProblem& problem, TeacherId teacherId)
{
    auto it = std::find_if(
        problem.teachers.begin(),
        problem.teachers.end(),
        [teacherId](const Teacher& teacher)
        {
            return teacher.id == teacherId;
        });

    if (it == problem.teachers.end())
    {
        throw std::runtime_error("Teacher not found: " + std::to_string(teacherId));
    }

    return *it;
}

inline const ClassGroup& findClassGroup(const TimetableProblem& problem, ClassGroupId classGroupId)
{
    auto it = std::find_if(
        problem.classGroups.begin(),
        problem.classGroups.end(),
        [classGroupId](const ClassGroup& classGroup)
        {
            return classGroup.id == classGroupId;
        });

    if (it == problem.classGroups.end())
    {
        throw std::runtime_error("ClassGroup not found: " + std::to_string(classGroupId));
    }

    return *it;
}
