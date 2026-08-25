#pragma once

#include "Domain/TimetableProblem.h"
#include "Preprocessing/PreprocessingModels.h"
#include "AvailabilityValidator.h"
#include "StructuralProblemValidator.h"
#include "ReferenceIntegrityValidator.h"

class TimetablePreprocessor
{
public:
    PreprocessingResult process(
        const TimetableProblem& problem) const
    {
        PreprocessingResult result;

        AppendIssues(
            result.issues,
            StructuralProblemValidator::validate(problem));

        AppendIssues(
            result.issues,
            ReferenceIntegrityValidator::validate(problem));

        /*
         * Availability validation assumes that dimensions
         * and references are at least structurally meaningful.
         *
         * The validator itself is defensive, but skipping it
         * after structural/reference errors avoids duplicate
         * or misleading diagnostics.
         */
        const bool hasBlockingValidationErrors =
            result.hasErrors();

        if (!hasBlockingValidationErrors)
        {
            AppendIssues(
                result.issues,
                AvailabilityValidator::validate(problem));
        }

        result.canOptimize =
            !result.hasErrors();

        if (!result.canOptimize)
        {
            return result;
        }

        result.lessonInstances =
            LessonInstanceGenerator::generate(problem);

        result.scheduleSlots =
            ScheduleSlotGenerator::generate(problem);

        /*
         * Final defensive check.
         *
         * Normally StructuralProblemValidator catches missing
         * lesson requirements and rooms earlier. This protects
         * the preprocessor if those rules change later.
         */
        if (!result.lessonInstances.empty() &&
            result.scheduleSlots.empty())
        {
            PreprocessingIssue issue;

            issue.severity =
                PreprocessingIssueSeverity::Error;

            issue.code =
                PreprocessingIssueCode::
                InsufficientRoomAvailability;

            issue.requiredCount =
                static_cast<int>(
                    result.lessonInstances.size());

            issue.availableCount = 0;

            issue.message =
                "Lesson instances were generated, but no "
                "schedule slots are available.";

            result.issues.push_back(
                std::move(issue));

            result.canOptimize = false;

            result.lessonInstances.clear();
            result.scheduleSlots.clear();
        }

        return result;
    };

private:
    void AppendIssues(
        std::vector<PreprocessingIssue>& destination,
        std::vector<PreprocessingIssue> source) const
    {
        destination.insert(
            destination.end(),
            std::make_move_iterator(source.begin()),
            std::make_move_iterator(source.end()));
    };
};