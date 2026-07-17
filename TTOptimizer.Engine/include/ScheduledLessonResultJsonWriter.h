#pragma once
#include <string>
#include <vector>

#include "../External/nlohmann/json.hpp"
#include "Domain/TimetableModels.h"
#include "Utils/Utils.h"

using json = nlohmann::json;

class ScheduledLessonResultJsonWriter
{

public:
    std::string writeSuccess(
        int iterations,
        double initialPenalty,
        double bestPenalty,
        const std::vector<ScheduledLesson>& scheduledLessons) const
    {
        json result;

        result["success"] = true;
        result["iterations"] = iterations;
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

