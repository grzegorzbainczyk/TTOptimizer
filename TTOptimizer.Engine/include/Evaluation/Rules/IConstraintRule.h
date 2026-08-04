#pragma once

#include "Evaluation/Rules/ConstraintRuleContext.h"
#include "Evaluation/Rules/ConstraintRuleResult.h"

class IConstraintRule
{
public:
    virtual ~IConstraintRule() = default;

    virtual ConstraintRuleResult evaluate(
        const ConstraintRuleContext& context) const = 0;
};
