#pragma once

#include <unordered_map>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"
#include "Evaluation/Rules/SubjectSchedulingRuleSupport.h"

class LessonRequirementPreferredRoomRule final : public IConstraintRule
{
public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;
        auto low = create(ConstraintRuleKind::Soft, ConstraintPenaltyLevel::Low,
            "LessonRequirementPreferredRoom.Low", "Prefer lesson room (Low)");
        auto medium = create(ConstraintRuleKind::Soft, ConstraintPenaltyLevel::Medium,
            "LessonRequirementPreferredRoom.Medium", "Prefer lesson room (Medium)");
        auto high = create(ConstraintRuleKind::Soft, ConstraintPenaltyLevel::High,
            "LessonRequirementPreferredRoom.High", "Prefer lesson room (High)");
        auto hard = create(ConstraintRuleKind::Hard, ConstraintPenaltyLevel::Hard,
            "LessonRequirementPreferredRoom.Hard", "Require lesson room (Hard)");

        std::unordered_map<LessonRequirementId, const LessonRequirement*> requirements;
        for (const LessonRequirement& requirement : context.problem.lessonRequirements)
        {
            requirements[requirement.id] = &requirement;
        }

        for (LessonInstanceIndex index = 0; index < context.chromosome.genes.size(); ++index)
        {
            if (index >= context.lessonInstances.size()) continue;
            const ScheduleSlotIndex slotIndex = context.chromosome.genes[index];
            if (slotIndex >= context.scheduleSlots.size()) continue;

            const auto found = requirements.find(context.lessonInstances[index].requirementId);
            if (found == requirements.end()) continue;
            const LessonRequirement& requirement = *found->second;
            if (requirement.preferredRoomId == 0 ||
                requirement.preferredRoomImportance == SchedulingPreferenceLevel::Disabled ||
                context.scheduleSlots[slotIndex].roomId == requirement.preferredRoomId)
            {
                continue;
            }

            ConstraintRuleResult* target = SubjectSchedulingRuleSupport::selectResult(
                requirement.preferredRoomImportance, low, medium, high, hard);
            if (target == nullptr) continue;
            ++target->violationCount;

            if (requirement.preferredRoomImportance == SchedulingPreferenceLevel::Hard)
            {
                ConstraintViolation violation;
                violation.type = ConstraintViolationType::LessonRequirementPreferredRoom;
                violation.studentGroupId = requirement.studentGroupId;
                violation.subjectId = requirement.subjectId;
                violation.roomId = context.scheduleSlots[slotIndex].roomId;
                violation.message = "Lesson is not assigned to its required room.";
                target->violations.push_back(std::move(violation));
            }
        }

        low.penalty = static_cast<double>(low.violationCount) * context.problem.optimizationSettings.penalties.low;
        medium.penalty = static_cast<double>(medium.violationCount) * context.problem.optimizationSettings.penalties.medium;
        high.penalty = static_cast<double>(high.violationCount) * context.problem.optimizationSettings.penalties.high;
        SubjectSchedulingRuleSupport::addResultIfViolated(results, std::move(low));
        SubjectSchedulingRuleSupport::addResultIfViolated(results, std::move(medium));
        SubjectSchedulingRuleSupport::addResultIfViolated(results, std::move(high));
        SubjectSchedulingRuleSupport::addResultIfViolated(results, std::move(hard));
        return results;
    }

private:
    static ConstraintRuleResult create(
        ConstraintRuleKind kind,
        ConstraintPenaltyLevel level,
        const char* code,
        const char* name)
    {
        return SubjectSchedulingRuleSupport::createResult(
            kind, level, code, name,
            "Counts lessons assigned outside the room configured directly on the lesson requirement.");
    }
};
