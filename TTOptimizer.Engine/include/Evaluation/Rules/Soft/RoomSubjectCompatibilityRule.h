#pragma once

#include "Evaluation/Rules/IConstraintRule.h"

class RoomSubjectCompatibilityRule final : public IConstraintRule
{
public:
    ConstraintRuleResult evaluate(
        const ConstraintRuleContext& context) const override;
};
