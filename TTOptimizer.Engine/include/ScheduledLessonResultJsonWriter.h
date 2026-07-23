#pragma once
#include <string>
#include <vector>

#include "../External/nlohmann/json.hpp"
#include "Domain/TimetableModels.h"
#include "Utils/Utils.h"

using json = nlohmann::json;

struct OptimizationInfo
{
    int iterations = 0;
    unsigned int randomSeed = 0;
    int threadCount = 1;
    long long durationMilliseconds = 0;
    std::string Message = "Feedback!!!";
};

class ScheduledLessonResultJsonWriter
{

public:
    std::string writeSuccess(
        double initialPenalty,
        double bestPenalty,
        const std::vector<ScheduledLesson>& scheduledLessons,
        const OptimizationInfo& info ) const
    {
        json result;

        result["success"] = true;
        result["initialPenalty"] = initialPenalty;
        result["bestPenalty"] = bestPenalty;
        result["scheduledLessons"] = json::array();

        for (const ScheduledLesson& lesson : scheduledLessons)
        {
            json lessonJson;

            lessonJson["lessonInstanceId"] = lesson.lessonInstanceId;
            lessonJson["requirementId"] = lesson.requirementId;

            lessonJson["classGroupId"] = lesson.classGroupId;
            lessonJson["subjectId"] = lesson.subjectId;
            lessonJson["teacherId"] = lesson.teacherId;
            lessonJson["roomId"] = lesson.roomId;

            lessonJson["day"] = Utils::ToString(lesson.timeSlot.day);
            lessonJson["lessonNumber"] = lesson.timeSlot.lessonNumber;

            result["scheduledLessons"].push_back(lessonJson);
        }

		result["optimizationInfo"]["iterations"] = info.iterations;
		result["optimizationInfo"]["randomSeed"] = info.randomSeed;
		result["optimizationInfo"]["threadCount"] = info.threadCount;
		result["optimizationInfo"]["durationMilliseconds"] = info.durationMilliseconds;
		result["optimizationInfo"]["message"] = info.Message;

        return result.dump(2);
    }

    std::string writeError(const std::string& message) const
    {
        json result;

        result["success"] = false;
        result["error"] = message;

        return result.dump(2);
    }
};

