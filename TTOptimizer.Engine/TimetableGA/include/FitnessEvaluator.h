#pragma once

#include "Domain.h"

class FitnessEvaluator
{
public:
    double evaluate(const Chromosome& chromosome, const TimetableProblem& problem) const;

private:
    int countTeacherCollisions(const Chromosome& chromosome, const TimetableProblem& problem) const;
    int countClassGroupCollisions(const Chromosome& chromosome, const TimetableProblem& problem) const;
    int countTeacherUnavailableViolations(const Chromosome& chromosome, const TimetableProblem& problem) const;
};
