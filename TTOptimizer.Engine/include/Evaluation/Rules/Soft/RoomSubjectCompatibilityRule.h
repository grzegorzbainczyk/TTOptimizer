#pragma once

#include <algorithm>
#include <stdexcept>
#include <utility>
#include "Evaluation/Rules/IConstraintRule.h"

class RoomSubjectCompatibilityRule final : public IConstraintRule
{
public:
	std::vector<ConstraintRuleResult> evaluate(
		const ConstraintRuleContext& context) const override
	{
		ConstraintRuleResult result;

		result.code = "RoomSubjectCompatibility";
		result.name = "Room subject compatibility";
		result.description =
			"Penalizes lessons assigned to rooms whose "
			"allowedSubjects collection does not contain the subject.";

		result.kind = ConstraintRuleKind::Soft;
		result.category = ConstraintRuleCategory::Room;
		result.penaltyLevel =
			ConstraintPenaltyLevel::Medium;

		for (LessonInstanceIndex lessonIndex = 0;
			lessonIndex < context.chromosome.genes.size();
			++lessonIndex)
		{
			const ScheduleSlotIndex scheduleSlotIndex =
				context.chromosome.genes[lessonIndex];

			/*
			 * Invalid chromosome data is reported by FitnessEvaluator.
			 * A soft rule must not dereference an invalid slot.
			 */
			if (lessonIndex >= context.lessonInstances.size() ||
				scheduleSlotIndex >= context.scheduleSlots.size())
			{
				continue;
			}

			const LessonInstance& lessonInstance =
				context.lessonInstances[lessonIndex];

			const LessonRequirement& requirement =
				FindRequirementById(
					context.problem,
					lessonInstance.requirementId);

			const ScheduleSlot& scheduleSlot =
				context.scheduleSlots[scheduleSlotIndex];

			const Room& room =
				FindRoomById(
					context.problem,
					scheduleSlot.roomId);

			if (!ContainsSubject(
				room.allowedSubjects,
				requirement.subjectId))
			{
				++result.violationCount;
			}
		}

		result.penalty =
			static_cast<double>(result.violationCount) *
			context.problem.optimizationSettings.penalties.medium;

		return { std::move(result) };
	}

private:
	const LessonRequirement& FindRequirementById(
		const TimetableProblem& problem,
		LessonRequirementId requirementId) const
	{
		const auto iterator = std::find_if(
			problem.lessonRequirements.begin(),
			problem.lessonRequirements.end(),
			[requirementId](
				const LessonRequirement& requirement)
			{
				return requirement.id == requirementId;
			});

		if (iterator == problem.lessonRequirements.end())
		{
			throw std::runtime_error(
				"Lesson requirement not found.");
		}

		return *iterator;
	}

	const Room& FindRoomById(
		const TimetableProblem& problem,
		RoomId roomId) const
	{
		const auto iterator = std::find_if(
			problem.rooms.begin(),
			problem.rooms.end(),
			[roomId](const Room& room)
			{
				return room.id == roomId;
			});

		if (iterator == problem.rooms.end())
		{
			throw std::runtime_error(
				"Room not found.");
		}

		return *iterator;
	}

	const bool ContainsSubject(
		const std::vector<SubjectId>& subjects,
		SubjectId subjectId) const
	{
		return std::find(
			subjects.begin(),
			subjects.end(),
			subjectId) != subjects.end();
	}
};
