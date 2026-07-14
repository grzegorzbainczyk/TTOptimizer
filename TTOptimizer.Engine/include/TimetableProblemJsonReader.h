#pragma once

#include <string>
#include <../External/nlohmann/json.hpp>
#include "Domain/TimetableModels.h"

class TimetableProblemJsonReader
{
public:
    TimetableProblem readFromFile(const std::string& filePath) const;
};