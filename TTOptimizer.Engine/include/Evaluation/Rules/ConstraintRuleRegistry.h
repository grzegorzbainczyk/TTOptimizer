#pragma once

#include <memory>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Soft/RoomSubjectCompatibilityRule.h"

class ConstraintRuleRegistry
{
public:
    ConstraintRuleRegistry()
    {
        rules_.push_back(
            std::make_unique<RoomSubjectCompatibilityRule>());
    }

    const std::vector<std::unique_ptr<IConstraintRule>>&
        rules() const
    {
        return rules_;
    }


private:
    std::vector<std::unique_ptr<IConstraintRule>> rules_;
};
