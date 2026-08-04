#include "Evaluation/Rules/ConstraintRuleRegistry.h"

#include <memory>

#include "Evaluation/Rules/Soft/RoomSubjectCompatibilityRule.h"

ConstraintRuleRegistry::ConstraintRuleRegistry()
{
    rules_.push_back(
        std::make_unique<RoomSubjectCompatibilityRule>());
}

const std::vector<std::unique_ptr<IConstraintRule>>&
ConstraintRuleRegistry::rules() const
{
    return rules_;
}
