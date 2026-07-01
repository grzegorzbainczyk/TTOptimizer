#pragma once

#include "Domain/TimetableModels.h"

// Harder deterministic test data set for the timetable optimizer.
//
// This data set is intentionally larger than test1.h:
// - Teachers: 15
// - Class groups: 10
// - Subjects: 10
// - Rooms: 15
// - Lesson requirements: 60
// - Lesson instances after expanding weeklyCount: 189
// - Schedule slots:
//   15 rooms * 5 days * 7 lesson slots = 525 schedule slots.
//
// It should be harder than test1.h because:
// - there are many more lessons,
// - teachers teach multiple classes,
// - some teachers have unavailable slots,
// - rooms are subject-specific,
// - not every subject can be scheduled in every room.
inline TimetableProblem CreateTestProblem2()
{
    TimetableProblem problem;

    problem.daysPerWeek = 5;
    problem.slotsPerDay = 7;

    problem.subjects = {
        { 1, "Math" },
        { 2, "English" },
        { 3, "Polish" },
        { 4, "History" },
        { 5, "Geography" },
        { 6, "Biology" },
        { 7, "Physics" },
        { 8, "Chemistry" },
        { 9, "Computer Science" },
        { 10, "PE" }
    };

    problem.teachers = {
        { 1,  "Jan Kowalski",        { 1 },       { { DayOfWeek::Wednesday, 1 }, { DayOfWeek::Wednesday, 2 } } },
        { 2,  "Anna Nowak",          { 1, 7 },    { { DayOfWeek::Friday, 6 }, { DayOfWeek::Friday, 7 } } },
        { 3,  "Maria Wisniewska",    { 2 },       { { DayOfWeek::Monday, 1 } } },
        { 4,  "Piotr Zielinski",     { 2, 3 },    { { DayOfWeek::Tuesday, 7 } } },
        { 5,  "Ewa Kaminska",        { 3 },       { { DayOfWeek::Thursday, 1 }, { DayOfWeek::Thursday, 2 } } },
        { 6,  "Tomasz Lewandowski",  { 4, 5 },    { { DayOfWeek::Friday, 1 } } },
        { 7,  "Katarzyna Wojcik",    { 4 },       { { DayOfWeek::Wednesday, 7 } } },
        { 8,  "Michal Dabrowski",    { 5, 6 },    { { DayOfWeek::Monday, 7 } } },
        { 9,  "Agnieszka Kozlowska", { 6 },       { { DayOfWeek::Tuesday, 1 }, { DayOfWeek::Tuesday, 2 } } },
        { 10, "Pawel Mazur",         { 7 },       { { DayOfWeek::Thursday, 7 } } },
        { 11, "Monika Krawczyk",     { 8 },       { { DayOfWeek::Wednesday, 3 } } },
        { 12, "Robert Grabowski",    { 8, 9 },    { { DayOfWeek::Friday, 7 } } },
        { 13, "Joanna Pawlak",       { 9 },       { { DayOfWeek::Monday, 6 }, { DayOfWeek::Monday, 7 } } },
        { 14, "Andrzej Sikora",      { 10 },      { { DayOfWeek::Thursday, 6 }, { DayOfWeek::Thursday, 7 } } },
        { 15, "Beata Krupa",         { 10 },      { { DayOfWeek::Wednesday, 1 } } }
    };

    problem.classGroups = {
        { 1,  "1A", 7 },
        { 2,  "1B", 7 },
        { 3,  "2A", 7 },
        { 4,  "2B", 7 },
        { 5,  "3A", 7 },
        { 6,  "3B", 7 },
        { 7,  "4A", 7 },
        { 8,  "4B", 7 },
        { 9,  "5A", 7 },
        { 10, "5B", 7 }
    };

    problem.rooms = {
        // General classrooms
        { 1,  "101", 30, { 1, 2, 3, 4, 5 } },
        { 2,  "102", 30, { 1, 2, 3, 4, 5 } },
        { 3,  "103", 30, { 1, 2, 3, 4, 5 } },
        { 4,  "104", 28, { 1, 2, 3, 4, 5 } },
        { 5,  "105", 28, { 1, 2, 3, 4, 5 } },

        // Science rooms
        { 6,  "Physics Lab",   24, { 7 } },
        { 7,  "Chemistry Lab", 24, { 8 } },
        { 8,  "Biology Lab",   24, { 6 } },
        { 9,  "Science Room",  26, { 6, 7, 8 } },

        // Computer rooms
        { 10, "Computer Lab A", 24, { 9 } },
        { 11, "Computer Lab B", 24, { 9 } },

        // PE rooms
        { 12, "Gym A", 40, { 10 } },
        { 13, "Gym B", 40, { 10 } },

        // Flexible rooms
        { 14, "Multimedia Room", 28, { 1, 2, 3, 4, 5, 9 } },
        { 15, "Workshop Room",   26, { 6, 7, 8, 9 } }
    };

    problem.lessonRequirements = {
        // 1A: 19 lessons/week
        { 1,  1, 1, 1, 4 },
        { 2,  1, 2, 3, 3 },
        { 3,  1, 3, 5, 4 },
        { 4,  1, 4, 6, 2 },
        { 5,  1, 9, 13, 2 },
        { 6,  1, 10, 14, 4 },

        // 1B: 18 lessons/week
        { 7,  2, 1, 2, 4 },
        { 8,  2, 2, 4, 3 },
        { 9,  2, 3, 5, 4 },
        { 10, 2, 5, 8, 2 },
        { 11, 2, 9, 13, 1 },
        { 12, 2, 10, 15, 4 },

        // 2A: 19 lessons/week
        { 13, 3, 1, 1, 4 },
        { 14, 3, 2, 3, 3 },
        { 15, 3, 3, 4, 4 },
        { 16, 3, 6, 9, 2 },
        { 17, 3, 7, 10, 2 },
        { 18, 3, 10, 14, 4 },

        // 2B: 18 lessons/week
        { 19, 4, 1, 2, 4 },
        { 20, 4, 2, 4, 3 },
        { 21, 4, 3, 5, 4 },
        { 22, 4, 4, 7, 2 },
        { 23, 4, 8, 11, 1 },
        { 24, 4, 10, 15, 4 },

        // 3A: 19 lessons/week
        { 25, 5, 1, 1, 4 },
        { 26, 5, 2, 3, 3 },
        { 27, 5, 4, 6, 2 },
        { 28, 5, 6, 8, 2 },
        { 29, 5, 9, 13, 2 },
        { 30, 5, 10, 14, 6 },

        // 3B: 19 lessons/week
        { 31, 6, 1, 2, 4 },
        { 32, 6, 2, 4, 3 },
        { 33, 6, 5, 6, 2 },
        { 34, 6, 7, 10, 2 },
        { 35, 6, 8, 12, 2 },
        { 36, 6, 10, 15, 6 },

        // 4A: 19 lessons/week
        { 37, 7, 1, 1, 4 },
        { 38, 7, 2, 3, 3 },
        { 39, 7, 3, 5, 3 },
        { 40, 7, 6, 9, 2 },
        { 41, 7, 7, 2, 3 },
        { 42, 7, 10, 14, 4 },

        // 4B: 19 lessons/week
        { 43, 8, 1, 2, 4 },
        { 44, 8, 2, 4, 3 },
        { 45, 8, 4, 7, 3 },
        { 46, 8, 6, 8, 2 },
        { 47, 8, 8, 11, 3 },
        { 48, 8, 10, 15, 4 },

        // 5A: 19 lessons/week
        { 49, 9, 1, 1, 4 },
        { 50, 9, 2, 3, 3 },
        { 51, 9, 3, 5, 3 },
        { 52, 9, 5, 8, 2 },
        { 53, 9, 9, 12, 3 },
        { 54, 9, 10, 14, 4 },

        // 5B: 20 lessons/week
        { 55, 10, 1, 2, 4 },
        { 56, 10, 2, 4, 3 },
        { 57, 10, 4, 6, 3 },
        { 58, 10, 7, 10, 3 },
        { 59, 10, 8, 11, 3 },
        { 60, 10, 10, 15, 4 }
    };

    return problem;
}
