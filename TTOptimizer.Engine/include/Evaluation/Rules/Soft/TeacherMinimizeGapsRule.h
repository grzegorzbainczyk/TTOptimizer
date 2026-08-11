#pragma once

#include <algorithm>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "Evaluation/Rules/IConstraintRule.h"

class TeacherMinimizeGapsRule final : public IConstraintRule
{
public:
    std::vector<ConstraintRuleResult> evaluate(
        const ConstraintRuleContext& context) const override
    {
        std::vector<ConstraintRuleResult> results;

        if (context.problem.teacherSchedulingPreferences.empty())
        {
            return results;
        }

        /*
         * One occupancy vector per teacher.
         *
         * Index:
         *     dayIndex * slotsPerDay + slotIndex
         *
         * bool occupancy is intentional here. It counts unique occupied
         * lesson slots, so an already-invalid chromosome containing two
         * lessons for one teacher at the same time does not corrupt the
         * gap calculation.
         */
        std::unordered_map<TeacherId, std::vector<bool>>
            occupiedSlotsByTeacher;

        for (const TeacherSchedulingPreference& preference :
            context.problem.teacherSchedulingPreferences)
        {
            if (preference.minimizeGaps ==
                SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            occupiedSlotsByTeacher.emplace(
                preference.teacherId,
                std::vector<bool>(
                    static_cast<std::size_t>(
                        context.problem.daysPerWeek *
                        context.problem.slotsPerDay),
                    false));
        }

        if (occupiedSlotsByTeacher.empty())
        {
            return results;
        }

        std::unordered_map<LessonRequirementId, TeacherId>
            teacherByRequirementId;

        teacherByRequirementId.reserve(
            context.problem.lessonRequirements.size());

        for (const LessonRequirement& requirement :
            context.problem.lessonRequirements)
        {
            teacherByRequirementId.emplace(
                requirement.id,
                requirement.teacherId);
        }

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < context.chromosome.genes.size();
            ++lessonIndex)
        {
            if (lessonIndex >= context.lessonInstances.size())
            {
                continue;
            }

            const ScheduleSlotIndex scheduleSlotIndex =
                context.chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= context.scheduleSlots.size())
            {
                continue;
            }

            const LessonInstance& lessonInstance =
                context.lessonInstances[lessonIndex];

            const auto teacherIterator =
                teacherByRequirementId.find(
                    lessonInstance.requirementId);

            if (teacherIterator ==
                teacherByRequirementId.end())
            {
                continue;
            }

            const TeacherId teacherId =
                teacherIterator->second;

            const auto occupancyIterator =
                occupiedSlotsByTeacher.find(teacherId);

            if (occupancyIterator ==
                occupiedSlotsByTeacher.end())
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                context.scheduleSlots[scheduleSlotIndex];

            const int dayIndex =
                static_cast<int>(
                    scheduleSlot.timeSlot.day);

            const int slotIndex =
                scheduleSlot.timeSlot.lessonNumber;

            if (dayIndex < 0 ||
                dayIndex >= context.problem.daysPerWeek ||
                slotIndex < 0 ||
                slotIndex >= context.problem.slotsPerDay)
            {
                continue;
            }

            const std::size_t occupancyIndex =
                static_cast<std::size_t>(
                    dayIndex *
                    context.problem.slotsPerDay +
                    slotIndex);

            occupancyIterator->second[occupancyIndex] =
                true;
        }

        /*
         * We aggregate results by level, not by teacher.
         * That keeps each evaluation small while still allowing
         * Low / Medium / High / Hard to coexist in one rule.
         */
        ConstraintRuleResult lowResult =
            createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Low,
                "TeacherMinimizeGaps.Low",
                "Minimize teacher gaps (Low)");

        ConstraintRuleResult mediumResult =
            createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::Medium,
                "TeacherMinimizeGaps.Medium",
                "Minimize teacher gaps (Medium)");

        ConstraintRuleResult highResult =
            createResult(
                ConstraintRuleKind::Soft,
                ConstraintPenaltyLevel::High,
                "TeacherMinimizeGaps.High",
                "Minimize teacher gaps (High)");

        ConstraintRuleResult hardResult =
            createResult(
                ConstraintRuleKind::Hard,
                ConstraintPenaltyLevel::Hard,
                "TeacherMinimizeGaps.Hard",
                "Minimize teacher gaps (Hard)");

        for (const TeacherSchedulingPreference& preference :
            context.problem.teacherSchedulingPreferences)
        {
            if (preference.minimizeGaps ==
                SchedulingPreferenceLevel::Disabled)
            {
                continue;
            }

            const auto occupancyIterator =
                occupiedSlotsByTeacher.find(
                    preference.teacherId);

            if (occupancyIterator ==
                occupiedSlotsByTeacher.end())
            {
                continue;
            }

            for (int dayIndex = 0;
                dayIndex < context.problem.daysPerWeek;
                ++dayIndex)
            {
                const int gapCount =
                    countGapsForDay(
                        occupancyIterator->second,
                        dayIndex,
                        context.problem.slotsPerDay);

                if (gapCount <= 0)
                {
                    continue;
                }

                switch (preference.minimizeGaps)
                {
                case SchedulingPreferenceLevel::Low:
                    lowResult.violationCount += gapCount;
                    break;

                case SchedulingPreferenceLevel::Medium:
                    mediumResult.violationCount += gapCount;
                    break;

                case SchedulingPreferenceLevel::High:
                    highResult.violationCount += gapCount;
                    break;

                case SchedulingPreferenceLevel::Hard:
                {
                    hardResult.violationCount += gapCount;

                    ConstraintViolation violation;
                    violation.type =
                        ConstraintViolationType::TeacherGap;
                    violation.teacherId =
                        preference.teacherId;
                    violation.dayIndex =
                        dayIndex;
                    violation.occurrenceCount =
                        gapCount;
                    violation.message =
                        "Teacher has gaps between lessons.";

                    hardResult.violations.push_back(
                        std::move(violation));

                    break;
                }

                case SchedulingPreferenceLevel::Disabled:
                    break;
                }
            }
        }

        lowResult.penalty =
            static_cast<double>(
                lowResult.violationCount) *
            context.problem.optimizationSettings.penalties.low;

        mediumResult.penalty =
            static_cast<double>(
                mediumResult.violationCount) *
            context.problem.optimizationSettings.penalties.medium;

        highResult.penalty =
            static_cast<double>(
                highResult.violationCount) *
            context.problem.optimizationSettings.penalties.high;

        addIfViolated(results, std::move(lowResult));
        addIfViolated(results, std::move(mediumResult));
        addIfViolated(results, std::move(highResult));
        addIfViolated(results, std::move(hardResult));

        return results;
    }

private:
    static ConstraintRuleResult createResult(
        ConstraintRuleKind kind,
        ConstraintPenaltyLevel penaltyLevel,
        std::string code,
        std::string name)
    {
        ConstraintRuleResult result;

        result.code = std::move(code);
        result.name = std::move(name);
        result.description =
            "Counts empty lesson slots between a teacher's "
            "first and last lesson of the day.";
        result.kind = kind;
        result.category =
            ConstraintRuleCategory::Teacher;
        result.penaltyLevel = penaltyLevel;

        return result;
    }

    static int countGapsForDay(
        const std::vector<bool>& occupiedSlots,
        int dayIndex,
        int slotsPerDay)
    {
        int firstSlot = -1;
        int lastSlot = -1;
        int occupiedCount = 0;

        const int dayOffset =
            dayIndex * slotsPerDay;

        for (int slotIndex = 0;
            slotIndex < slotsPerDay;
            ++slotIndex)
        {
            const std::size_t index =
                static_cast<std::size_t>(
                    dayOffset + slotIndex);

            if (!occupiedSlots[index])
            {
                continue;
            }

            if (firstSlot < 0)
            {
                firstSlot = slotIndex;
            }

            lastSlot = slotIndex;
            ++occupiedCount;
        }

        if (occupiedCount <= 1)
        {
            return 0;
        }

        return
            lastSlot -
            firstSlot +
            1 -
            occupiedCount;
    }

    static void addIfViolated(
        std::vector<ConstraintRuleResult>& results,
        ConstraintRuleResult result)
    {
        if (result.violationCount <= 0)
        {
            return;
        }

        results.push_back(
            std::move(result));
    }
};
