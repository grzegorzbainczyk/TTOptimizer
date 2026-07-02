#include "../External/nlohmann/json.hpp"
#include "Utils/Utils.h"

using json = nlohmann::json;

class TimetableJsonWriter
{
public:
    std::string writeSuccess(
        double initialPenalty,
        double bestPenalty,
        const std::vector<ScheduledLessonView>& lessons) const
    {
        json result;

        result["success"] = true;
        result["initialPenalty"] = initialPenalty;
        result["bestPenalty"] = bestPenalty;

        result["scheduledLessons"] = json::array();

        for (const ScheduledLessonView& lesson : lessons)
        {
            json lessonJson;

            lessonJson["lessonInstanceId"] = lesson.lessonInstanceId;
            lessonJson["classGroup"] = lesson.classGroupName;
            lessonJson["subject"] = lesson.subjectName;
            lessonJson["teacher"] = lesson.teacherName;
            lessonJson["room"] = lesson.roomName;
            lessonJson["day"] = Utils::ToString(lesson.day);
            lessonJson["lessonNumber"] = lesson.lessonNumber;

            result["scheduledLessons"].push_back(lessonJson);
        }

        return result.dump(2);
    }

    std::string writeError(
        const std::string& message) const
    {
        json result;

        result["success"] = false;
        result["error"] = message;

        return result.dump(2);
    }
};

