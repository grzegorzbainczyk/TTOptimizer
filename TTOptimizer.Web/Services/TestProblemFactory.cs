using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Services;

public class TestProblemFactory
{
    public TimetableProblem CreateTestProblem1()
    {
        var problem = new TimetableProblem
        {
            DaysPerWeek = 5,
            SlotsPerDay = 6
        };

        problem.Subjects = CreateSubjects();
        problem.Teachers = CreateTeachers();
        problem.ClassGroups = CreateClassGroups();
        problem.Rooms = CreateRooms();
        problem.LessonRequirements = CreateLessonRequirements();

        return problem;
    }

    private static List<Subject> CreateSubjects()
    {
        return new List<Subject>
        {
            new Subject { Id = 1, Name = "Math" },
            new Subject { Id = 2, Name = "English" },
            new Subject { Id = 3, Name = "Physics" },
            new Subject { Id = 4, Name = "History" },
            new Subject { Id = 5, Name = "PE" },
            new Subject { Id = 6, Name = "Computer Science" }
        };
    }

    private static List<Teacher> CreateTeachers()
    {
        return new List<Teacher>
        {
            new Teacher { Id = 1, Name = "Jan Kowalski", Subjects = new List<int> { 1 } },
            new Teacher { Id = 2, Name = "Anna Nowak", Subjects = new List<int> { 2 } },
            new Teacher { Id = 3, Name = "Piotr Zielinski", Subjects = new List<int> { 3 } },
            new Teacher { Id = 4, Name = "Maria Wisniewska", Subjects = new List<int> { 4 } },
            new Teacher { Id = 5, Name = "Tomasz Lewandowski", Subjects = new List<int> { 5, 6 } }
        };
    }

    private static List<ClassGroup> CreateClassGroups()
    {
        return new List<ClassGroup>
        {
            new ClassGroup { Id = 1, Name = "1A" },
            new ClassGroup { Id = 2, Name = "1B" },
            new ClassGroup { Id = 3, Name = "2A" }
        };
    }

    private static List<Room> CreateRooms()
    {
        return new List<Room>
        {
            new Room { Id = 1, Name = "101" },
            new Room { Id = 2, Name = "102" },
            new Room { Id = 3, Name = "Physics Lab" },
            new Room { Id = 4, Name = "Computer Lab" },
            new Room { Id = 5, Name = "Gym" },
            new Room { Id = 6, Name = "History Room" }
        };
    }

    private static List<LessonRequirement> CreateLessonRequirements()
    {
        return new List<LessonRequirement>
        {
            new LessonRequirement { Id = 1, ClassGroupId = 1, SubjectId = 1, TeacherId = 1, WeeklyCount = 4 },
            new LessonRequirement { Id = 2, ClassGroupId = 1, SubjectId = 2, TeacherId = 2, WeeklyCount = 3 },
            new LessonRequirement { Id = 3, ClassGroupId = 1, SubjectId = 3, TeacherId = 3, WeeklyCount = 2 },
            new LessonRequirement { Id = 4, ClassGroupId = 1, SubjectId = 4, TeacherId = 4, WeeklyCount = 2 },
            new LessonRequirement { Id = 5, ClassGroupId = 1, SubjectId = 5, TeacherId = 5, WeeklyCount = 2 },

            new LessonRequirement { Id = 6, ClassGroupId = 2, SubjectId = 1, TeacherId = 1, WeeklyCount = 4 },
            new LessonRequirement { Id = 7, ClassGroupId = 2, SubjectId = 2, TeacherId = 2, WeeklyCount = 3 },
            new LessonRequirement { Id = 8, ClassGroupId = 2, SubjectId = 3, TeacherId = 3, WeeklyCount = 2 },
            new LessonRequirement { Id = 9, ClassGroupId = 2, SubjectId = 4, TeacherId = 4, WeeklyCount = 2 },

            new LessonRequirement { Id = 10, ClassGroupId = 3, SubjectId = 1, TeacherId = 1, WeeklyCount = 4 },
            new LessonRequirement { Id = 11, ClassGroupId = 3, SubjectId = 2, TeacherId = 2, WeeklyCount = 3 },
            new LessonRequirement { Id = 12, ClassGroupId = 3, SubjectId = 5, TeacherId = 5, WeeklyCount = 2 },
            new LessonRequirement { Id = 13, ClassGroupId = 3, SubjectId = 6, TeacherId = 5, WeeklyCount = 1 }
        };
    }
}