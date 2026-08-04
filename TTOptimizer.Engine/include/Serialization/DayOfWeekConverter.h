#pragma once

#include <string>
#include "Domain/TimetableModels.h"

class DayOfWeekConverter
{
public:
    static std::string toString(DayOfWeek day)
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

        case DayOfWeek::Saturday:
            return "Saturday";

        case DayOfWeek::Sunday:
            return "Sunday";

        default:
            return "Unknown";
        }
    }
};