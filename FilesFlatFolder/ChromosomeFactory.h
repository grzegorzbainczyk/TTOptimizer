#pragma once

#include "Domain.h"

#include <random>

class ChromosomeFactory
{
public:
    explicit ChromosomeFactory(unsigned int seed = std::random_device{}());

    Chromosome createRandom(const TimetableProblem& problem);

private:
    TimeSlot randomTimeSlot(const TimetableProblem& problem);
    std::optional<RoomId> randomRoomId(const TimetableProblem& problem);

    std::mt19937 generator_;
};
