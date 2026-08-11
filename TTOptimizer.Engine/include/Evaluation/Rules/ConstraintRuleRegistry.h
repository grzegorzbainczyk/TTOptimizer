#pragma once

#include <memory>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Soft/RoomSubjectCompatibilityRule.h"
#include "Soft/TeacherMinimizeGapsRule.h"

class ConstraintRuleRegistry
{
public:
    ConstraintRuleRegistry()
    {
        rules_.push_back(
            std::make_unique<RoomSubjectCompatibilityRule>());
        rules_.push_back(
            std::make_unique<TeacherMinimizeGapsRule>());
    }

    const std::vector<std::unique_ptr<IConstraintRule>>&
        rules() const
    {
        return rules_;
    }


private:
    std::vector<std::unique_ptr<IConstraintRule>> rules_;
};
