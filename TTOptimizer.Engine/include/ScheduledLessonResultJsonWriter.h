#pragma once

#include <string>
#include <vector>

#include "../External/nlohmann/json.hpp"

#include "Domain/TimetableModels.h"
#include "Preprocessing/PreprocessingModels.h"
#include "Utils/Utils.h"

using json = nlohmann::json;

struct OptimizationInfo
{
	int iterations = 0;
	unsigned int randomSeed = 0;
	int threadCount = 1;
	long long durationMilliseconds = 0;
	std::string message = "Feedback!!!";
};

class ResultJsonWriter
{
public:
	std::string writeSuccess(
		double initialPenalty,
		const FitnessScore& score,
		const std::vector<ScheduledLesson>& scheduledLessons,
		const OptimizationInfo& info) const
	{
		json result;

		result["success"] = true;
		result["canOptimize"] = true;
		result["initialPenalty"] = initialPenalty;
		result["hardViolationCount"] =
			score.hardViolationCount;
		result["bestPenalty"] =
			score.softPenalty;

		result["preprocessingIssues"] =
			json::array();

		result["scheduledLessons"] =
			json::array();

		for (const ScheduledLesson& lesson :
			scheduledLessons)
		{
			json lessonJson;

			lessonJson["lessonInstanceId"] =
				lesson.lessonInstanceId;

			lessonJson["requirementId"] =
				lesson.requirementId;

			lessonJson["classGroupId"] =
				lesson.classGroupId;

			lessonJson["subjectId"] =
				lesson.subjectId;

			lessonJson["teacherId"] =
				lesson.teacherId;

			lessonJson["roomId"] =
				lesson.roomId;

			lessonJson["day"] =
				Utils::ToString(
					lesson.timeSlot.day);

			lessonJson["lessonNumber"] =
				lesson.timeSlot.lessonNumber;

			result["scheduledLessons"].push_back(
				std::move(lessonJson));
		}

		result["optimizationInfo"]["iterations"] =
			info.iterations;

		result["optimizationInfo"]["randomSeed"] =
			info.randomSeed;

		result["optimizationInfo"]["threadCount"] =
			info.threadCount;

		result["optimizationInfo"]
			["durationMilliseconds"] =
			info.durationMilliseconds;

		result["optimizationInfo"]["message"] =
			info.message;

		return result.dump(2);
	}

	std::string writePreprocessingFailure(
		const PreprocessingResult&
		preprocessingResult) const
	{
		json result;

		result["success"] = false;
		result["canOptimize"] = false;

		result["message"] =
			"The timetable problem contains invalid "
			"or infeasible constraints.";

		result["hardViolationCount"] = 0;
		result["bestPenalty"] = 0.0;
		result["initialPenalty"] = 0.0;

		result["scheduledLessons"] =
			json::array();

		result["preprocessingIssues"] =
			json::array();

		for (const PreprocessingIssue& issue :
			preprocessingResult.issues)
		{
			json issueJson;

			issueJson["severity"] =
				severityToString(
					issue.severity);

			issueJson["code"] =
				issueCodeToString(
					issue.code);

			issueJson["message"] =
				issue.message;

			/*
			 * Resource IDs use zero as "not applicable"
			 * in the current diagnostic model.
			 */
			issueJson["teacherId"] =
				issue.teacherId;

			issueJson["classGroupId"] =
				issue.classGroupId;

			issueJson["subjectId"] =
				issue.subjectId;

			issueJson["roomId"] =
				issue.roomId;

			issueJson["requirementId"] =
				issue.requirementId;

			issueJson["dayIndex"] =
				issue.dayIndex;

			issueJson["slotIndex"] =
				issue.slotIndex;

			issueJson["requiredCount"] =
				issue.requiredCount;

			issueJson["availableCount"] =
				issue.availableCount;

			result["preprocessingIssues"].push_back(
				std::move(issueJson));
		}

		result["optimizationInfo"]["iterations"] = 0;
		result["optimizationInfo"]["randomSeed"] = 0;
		result["optimizationInfo"]["threadCount"] = 1;
		result["optimizationInfo"]
			["durationMilliseconds"] = 0;

		result["optimizationInfo"]["message"] =
			"Optimization was not started because "
			"preprocessing found blocking errors.";

		return result.dump(2);
	}

	std::string writeError(
		const std::string& message) const
	{
		json result;

		result["success"] = false;
		result["canOptimize"] = false;
		result["error"] = message;

		result["preprocessingIssues"] =
			json::array();

		result["scheduledLessons"] =
			json::array();

		return result.dump(2);
	}

private:
	static std::string severityToString(
		PreprocessingIssueSeverity severity)
	{
		switch (severity)
		{
		case PreprocessingIssueSeverity::Warning:
			return "Warning";

		case PreprocessingIssueSeverity::Error:
			return "Error";
		}

		return "Unknown";
	}

	static std::string issueCodeToString(
		PreprocessingIssueCode code)
	{
		switch (code)
		{
		case PreprocessingIssueCode::InvalidDaysPerWeek:
			return "InvalidDaysPerWeek";

		case PreprocessingIssueCode::InvalidSlotsPerDay:
			return "InvalidSlotsPerDay";

		case PreprocessingIssueCode::InvalidWeeklyCount:
			return "InvalidWeeklyCount";

		case PreprocessingIssueCode::InvalidUnavailability:
			return "InvalidUnavailability";

		case PreprocessingIssueCode::MissingTeachers:
			return "MissingTeachers";

		case PreprocessingIssueCode::MissingClassGroups:
			return "MissingClassGroups";

		case PreprocessingIssueCode::MissingSubjects:
			return "MissingSubjects";

		case PreprocessingIssueCode::MissingRooms:
			return "MissingRooms";

		case PreprocessingIssueCode::MissingLessonRequirements:
			return "MissingLessonRequirements";

		case PreprocessingIssueCode::TeacherNotFound:
			return "TeacherNotFound";

		case PreprocessingIssueCode::ClassGroupNotFound:
			return "ClassGroupNotFound";

		case PreprocessingIssueCode::SubjectNotFound:
			return "SubjectNotFound";

		case PreprocessingIssueCode::RoomNotFound:
			return "RoomNotFound";

		case PreprocessingIssueCode::TeacherInsufficientAvailability:
			return "TeacherInsufficientAvailability";

		case PreprocessingIssueCode::ClassGroupInsufficientAvailability:
			return "ClassGroupInsufficientAvailability";

		case PreprocessingIssueCode::InsufficientRoomAvailability:
			return "InsufficientRoomAvailability";
		}

		return "Unknown";
	}
};