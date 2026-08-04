#pragma once

#include <memory>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"

class ConstraintRuleRegistry
{
public:
    ConstraintRuleRegistry();

    const std::vector<std::unique_ptr<IConstraintRule>>&
        rules() const;

private:
    std::vector<std::unique_ptr<IConstraintRule>> rules_;
};
