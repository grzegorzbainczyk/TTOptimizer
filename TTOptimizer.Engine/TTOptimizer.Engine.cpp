#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <cmath>
#include "external/nlohmann/json.hpp"
#include "TimetableModels.h"
#include "test1.h"
#include "ScheduleSlotGenerator.h"
#include "LessonInstanceGenerator.h"
#include "ChromosomeFactory.h"

    int main(int argc, char* argv[])
    {
        TimetableProblem problem = CreateTestProblem1();

        ScheduleSlotGenerator scheduleSlotGenerator;
        std::vector<ScheduleSlot> scheduleSlots = scheduleSlotGenerator.generate(problem);

        LessonInstanceGenerator lessonInstanceGenerator;
        std::vector<LessonInstance> lessonInstances = lessonInstanceGenerator.generate(problem);

        std::cout << "Teachers: " << problem.teachers.size() << '\n';
        std::cout << "Classes: " << problem.classGroups.size() << '\n';
        std::cout << "Subjects: " << problem.subjects.size() << '\n';
        std::cout << "Rooms: " << problem.rooms.size() << '\n';
        std::cout << "Lesson requirements: " << problem.lessonRequirements.size() << '\n';
        std::cout << "Schedule slots: " << scheduleSlots.size() << '\n';
        std::cout << "Lesson instances: " << lessonInstances.size() << '\n';


        ChromosomeFactory chromosome_factory(123); // Seed for reproducibility
		Chromosome first_chromosome = chromosome_factory.createRandom(scheduleSlots, lessonInstances);




        return 0;
    }
