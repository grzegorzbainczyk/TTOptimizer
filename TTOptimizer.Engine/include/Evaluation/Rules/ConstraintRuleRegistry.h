#pragma once

#include <memory>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Soft/RoomSubjectCompatibilityRule.h"
#include "Soft/TeacherMinimizeGapsRule.h"
#include "Soft/TeacherAvoidSingleLessonDayRule.h"
#include "Soft/TeacherMaxConsecutiveLessonsRule.h"
#include "Soft/TeacherMaxLessonsPerDayRule.h"
#include "Soft/ClassGroupMinimizeGapsRule.h"
#include "Soft/ClassGroupAvoidSingleLessonDayRule.h"
#include "Soft/ClassGroupMaxConsecutiveLessonsRule.h"
#include "Soft/ClassGroupMaxLessonsPerDayRule.h"

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

        rules_.push_back(
            std::make_unique<ClassGroupMinimizeGapsRule>());

        rules_.push_back(
            std::make_unique<ClassGroupAvoidSingleLessonDayRule>());

        rules_.push_back(
            std::make_unique<ClassGroupMaxConsecutiveLessonsRule>());

        rules_.push_back(
            std::make_unique<ClassGroupMaxLessonsPerDayRule>());
    }

    const std::vector<std::unique_ptr<IConstraintRule>>&
        rules() const
    {
        return rules_;
    }

private:
    std::vector<std::unique_ptr<IConstraintRule>> rules_;
};
