#pragma once

#include "Domain/TimetableProblem.h"
#include "Preprocessing/PreprocessingModels.h"

class TimetablePreprocessor
{
public:
    PreprocessingResult process(
        const TimetableProblem& problem) const;
};