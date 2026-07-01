#pragma once

#include "TimetableModels.h"

// Small deterministic test data set for early development.
//
// Expected generated data:
// - Teachers: 5
// - Class groups: 3
// - Subjects: 6
// - Rooms: 6
// - Lesson requirements: 13
// - Lesson instances after expanding weeklyCount: 28
// - Schedule slots:
//   6 rooms * 5 days * 6 lesson slots = 180 schedule slots.
inline TimetableProblem CreateTestProblem1()
{
    TimetableProblem problem;

    problem.daysPerWeek = 5;
    problem.slotsPerDay = 6;

    problem.subjects = {
        { 1, "Math" },
        { 2, "English" },
        { 3, "Polish" },
        { 4, "History" },
        { 5, "Computer Science" },
        { 6, "PE" }
    };

    problem.teachers = {
        {
            1,
            "Jan Kowalski",
            { 1 }, // Math
            {
                { DayOfWeek::Wednesday, 1 },
                { DayOfWeek::Wednesday, 2 }
            }
        },
        {
            2,
            "Anna Nowak",
            { 2 }, // English
            {
                { DayOfWeek::Friday, 5 },
                { DayOfWeek::Friday, 6 }
            }
        },
        {
            3,
            "Maria Wisniewska",
            { 3, 4 }, // Polish, History
            {
                { DayOfWeek::Monday, 6 }
            }
        },
        {
            4,
            "Piotr Zielinski",
            { 5 }, // Computer Science
            {
                { DayOfWeek::Tuesday, 1 }
            }
        },
        {
            5,
            "Andrzej Sikora",
            { 6 }, // PE
            {
                { DayOfWeek::Thursday, 6 }
            }
        }
    };

    problem.classGroups = {
        { 1, "1A", 6 },
        { 2, "1B", 6 },
        { 3, "2A", 6 }
    };

    problem.rooms = {
        // Standard classrooms
        { 1, "101", 30, { 1, 2, 3, 4 } },
        { 2, "102", 30, { 1, 2, 3, 4 } },
        { 3, "103", 30, { 1, 2, 3, 4 } },

        // Dedicated rooms
        { 4, "Computer Lab", 24, { 5 } },
        { 5, "Gym", 40, { 6 } },

        // Flexible room
        { 6, "Multimedia Room", 28, { 1, 2, 3, 4, 5 } }
    };

    problem.lessonRequirements = {
        // Class 1A: 10 lessons/week
        { 1,  1, 1, 1, 3 },  // 1A Math with Jan Kowalski, 3 times/week
        { 2,  1, 2, 2, 2 },  // 1A English with Anna Nowak, 2 times/week
        { 3,  1, 3, 3, 2 },  // 1A Polish with Maria Wisniewska, 2 times/week
        { 4,  1, 5, 4, 1 },  // 1A Computer Science with Piotr Zielinski, 1 time/week
        { 5,  1, 6, 5, 2 },  // 1A PE with Andrzej Sikora, 2 times/week

        // Class 1B: 9 lessons/week
        { 6,  2, 1, 1, 3 },  // 1B Math
        { 7,  2, 2, 2, 2 },  // 1B English
        { 8,  2, 4, 3, 2 },  // 1B History
        { 9,  2, 6, 5, 2 },  // 1B PE

        // Class 2A: 9 lessons/week
        { 10, 3, 1, 1, 3 },  // 2A Math
        { 11, 3, 3, 3, 3 },  // 2A Polish
        { 12, 3, 5, 4, 1 },  // 2A Computer Science
        { 13, 3, 6, 5, 2 }   // 2A PE
    };

    return problem;
}