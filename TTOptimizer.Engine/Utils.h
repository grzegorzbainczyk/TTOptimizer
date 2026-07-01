#pragma once
#include <string>
#include "TimeTableModels.h"


class Utils
{
public:
    static std::string ToString(DayOfWeek day)
    {
        switch (day)
        {
        case DayOfWeek::Monday:
            return "Monday";
        case DayOfWeek::Tuesday:
            return "Tuesday";
        case DayOfWeek::Wednesday:
            return "Wednesday";
        case DayOfWeek::Thursday:
            return "Thursday";
        case DayOfWeek::Friday:
            return "Friday";
        default:
            return "Unknown";
        }
    }
};

