#pragma once

#include <string>
#include <vector>

#include "Evaluation/ConstraintViolation.h"

enum class ConstraintRuleKind
{
    Hard,
    Soft
};

enum class ConstraintRuleCategory
{
    Technical,
    Teacher,
    ClassGroup,
    Room,
    Subject,
    Lesson,
    Global
};

enum class ConstraintPenaltyLevel
{
    None,
    Low,
    Medium,
    High,
    Hard
};

struct ConstraintRuleResult
{
    std::string code;
    std::string name;
    std::string description;

    ConstraintRuleKind kind{
        ConstraintRuleKind::Soft
    };

    ConstraintRuleCategory category{
        ConstraintRuleCategory::Global
    };

    ConstraintPenaltyLevel penaltyLevel{
        ConstraintPenaltyLevel::None
    };

    int violationCount{};
    double penalty{};

    std::vector<ConstraintViolation> violations;
};
