#pragma once

#include <memory>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Soft/RoomSubjectCompatibilityRule.h"
#include "Soft/TeacherMinimizeGapsRule.h"
#include "Soft/TeacherAvoidSingleLessonDayRule.h"
#include "Soft/TeacherMaxConsecutiveLessonsRule.h"
#include "Soft/TeacherMaxLessonsPerDayRule.h"

class ConstraintRuleRegistry
{
public:
    ConstraintRuleRegistry()
    {
        rules_.push_back(
            std::make_unique<RoomSubjectCompatibilityRule>());

        rules_.push_back(
            std::make_unique<TeacherMinimizeGapsRule>());

        rules_.push_back(
            std::make_unique<TeacherAvoidSingleLessonDayRule>());

        rules_.push_back(
            std::make_unique<TeacherMaxConsecutiveLessonsRule>());

        rules_.push_back(
            std::make_unique<TeacherMaxLessonsPerDayRule>());
    }

    const std::vector<std::unique_ptr<IConstraintRule>>&
        rules() const
    {
        return rules_;
    }

private:
    std::vector<std::unique_ptr<IConstraintRule>> rules_;
};
