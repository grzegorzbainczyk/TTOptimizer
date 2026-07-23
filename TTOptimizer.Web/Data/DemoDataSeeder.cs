using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Data;

public class DemoDataSeeder
{
    private const string EasyDemoOrganizationName =
        "Demo School Easy";

    private const string HardDemoOrganizationName =
        "Demo School Hard";

    private readonly AppDbContext _context;

    public DemoDataSeeder(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> ResetEasyDemoDataAsync()
    {
        var organizationId =
            await GetOrCreateOrganizationAsync(
                EasyDemoOrganizationName
            );

        await ClearDemoDataAsync(organizationId);
        await CreateEasyDemoDataAsync(organizationId);

        return organizationId;
    }

    public async Task<int> ResetHardDemoDataAsync()
    {
        var organizationId =
            await GetOrCreateOrganizationAsync(
                HardDemoOrganizationName
            );

        await ClearDemoDataAsync(organizationId);
        await CreateHardDemoDataAsync(organizationId);

        return organizationId;
    }

    private async Task<int> GetOrCreateOrganizationAsync(
        string organizationName)
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(
                x => x.Name == organizationName
            );

        if (organization != null)
        {
            return organization.Id;
        }

        organization = new Organization
        {
            Name = organizationName
        };

        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        return organization.Id;
    }

    private async Task ClearDemoDataAsync(int organizationId)
    {
        var lessonRequirements =
            await _context.LessonRequirements
                .Where(x => x.OrganizationId == organizationId)
                .ToListAsync();

        var rooms = await _context.Rooms
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync();

        var subjects = await _context.Subjects
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync();

        var classGroups = await _context.ClassGroups
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync();

        var teachers = await _context.Teachers
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync();

        _context.LessonRequirements.RemoveRange(
            lessonRequirements
        );

        _context.ClassGroups.RemoveRange(classGroups);
        _context.Rooms.RemoveRange(rooms);
        _context.Subjects.RemoveRange(subjects);
        _context.Teachers.RemoveRange(teachers);

        await _context.SaveChangesAsync();
    }

    private async Task CreateEasyDemoDataAsync(
        int organizationId)
    {
        var anna = new Teacher
        {
            TeacherNumber = 1,
            Name = "Anna Kowalska",
            Alias = "AK",
            Info = "Prefers morning lessons.",
            OrganizationId = organizationId
        };

        var jan = new Teacher
        {
            TeacherNumber = 2,
            Name = "Jan Nowak",
            Alias = "JN",
            Info = null,
            OrganizationId = organizationId
        };

        var piotr = new Teacher
        {
            TeacherNumber = 3,
            Name = "Piotr Zieliński",
            Alias = "PZ",
            Info = null,
            OrganizationId = organizationId
        };

        var room101 = new Room
        {
            Name = "101",
            OrganizationId = organizationId
        };

        var room102 = new Room
        {
            Name = "102",
            OrganizationId = organizationId
        };

        var class1A = new ClassGroup
        {
            Name = "1A",
            Info = "Main classroom for group 1A.",
            HomeroomTeacher = anna,
            DefaultRoom = room101,
            OrganizationId = organizationId
        };

        var class1B = new ClassGroup
        {
            Name = "1B",
            Info = "Main classroom for group 1B.",
            HomeroomTeacher = jan,
            DefaultRoom = room102,
            OrganizationId = organizationId
        };

        var mathematics = new Subject
        {
            Name = "Mathematics",
            OrganizationId = organizationId
        };

        var polish = new Subject
        {
            Name = "Polish",
            OrganizationId = organizationId
        };

        var english = new Subject
        {
            Name = "English",
            OrganizationId = organizationId
        };

        _context.Teachers.AddRange(
            anna,
            jan,
            piotr
        );

        _context.Rooms.AddRange(
            room101,
            room102
        );

        _context.ClassGroups.AddRange(
            class1A,
            class1B
        );

        _context.Subjects.AddRange(
            mathematics,
            polish,
            english
        );

        await _context.SaveChangesAsync();

        var lessonRequirements =
            new List<LessonRequirement>
            {
                CreateRequirement(
                    organizationId,
                    class1A,
                    mathematics,
                    anna,
                    4),

                CreateRequirement(
                    organizationId,
                    class1A,
                    polish,
                    jan,
                    3),

                CreateRequirement(
                    organizationId,
                    class1A,
                    english,
                    piotr,
                    2),

                CreateRequirement(
                    organizationId,
                    class1B,
                    mathematics,
                    anna,
                    4),

                CreateRequirement(
                    organizationId,
                    class1B,
                    polish,
                    jan,
                    3),

                CreateRequirement(
                    organizationId,
                    class1B,
                    english,
                    piotr,
                    2)
            };

        _context.LessonRequirements.AddRange(
            lessonRequirements
        );

        await _context.SaveChangesAsync();
    }

    private async Task CreateHardDemoDataAsync(
        int organizationId)
    {
        var teachers = CreateTeachers(
            organizationId,
            new[]
            {
                "Anna Kowalska",
                "Marek Wiśniewski",
                "Joanna Nowak",
                "Tomasz Zieliński",
                "Katarzyna Wójcik",
                "Piotr Kamiński",
                "Magdalena Lewandowska",
                "Robert Dąbrowski",
                "Agnieszka Szymańska",
                "Paweł Woźniak",
                "Monika Kozłowska",
                "Krzysztof Jankowski"
            });

        var classGroups = CreateClassGroups(
            organizationId,
            new[]
            {
                "1A",
                "1B",
                "2A",
                "2B",
                "3A",
                "3B",
                "4A",
                "4B"
            });

        var subjects = CreateSubjects(
            organizationId,
            new[]
            {
                "Mathematics",
                "Polish",
                "English",
                "History",
                "Geography",
                "Biology",
                "Physics",
                "Chemistry",
                "Computer Science",
                "Physical Education"
            });

        var rooms = CreateRooms(
            organizationId,
            new[]
            {
                "101",
                "102",
                "103",
                "104",
                "201",
                "202",
                "Computer Lab",
                "Physics Lab",
                "Chemistry Lab",
                "Gym"
            });

        ConfigureHardDemoRooms(rooms, subjects);

        ConfigureHardDemoClassGroups(
            classGroups,
            teachers,
            rooms
        );

        _context.Teachers.AddRange(teachers.Values);
        _context.Rooms.AddRange(rooms.Values);
        _context.ClassGroups.AddRange(classGroups.Values);
        _context.Subjects.AddRange(subjects.Values);

        await _context.SaveChangesAsync();

        var lessonRequirements =
            new List<LessonRequirement>();

        foreach (var classGroup in classGroups.Values)
        {
            AddHardClassRequirements(
                organizationId,
                classGroup,
                teachers,
                subjects,
                lessonRequirements
            );
        }

        _context.LessonRequirements.AddRange(
            lessonRequirements
        );

        await _context.SaveChangesAsync();
    }

    private static void ConfigureHardDemoRooms(
    IReadOnlyDictionary<string, Room> rooms,
    IReadOnlyDictionary<string, Subject> subjects)
    {
        rooms["Gym"].RestrictedToSubject =
            subjects["Physical Education"];

        rooms["Gym"].PreferredSubject =
            subjects["Physical Education"];

        rooms["Chemistry Lab"].RestrictedToSubject =
            subjects["Chemistry"];

        rooms["Chemistry Lab"].PreferredSubject =
            subjects["Chemistry"];

        rooms["Physics Lab"].PreferredSubject =
            subjects["Physics"];

        rooms["Computer Lab"].PreferredSubject =
            subjects["Computer Science"];
    }

    private static void ConfigureHardDemoClassGroups(
        IDictionary<string, ClassGroup> classGroups,
        IReadOnlyDictionary<string, Teacher> teachers,
        IReadOnlyDictionary<string, Room> rooms)
    {
        SetClassGroupDetails(
            classGroups["1A"],
            teachers["Anna Kowalska"],
            rooms["101"]);

        SetClassGroupDetails(
            classGroups["1B"],
            teachers["Joanna Nowak"],
            rooms["102"]);

        SetClassGroupDetails(
            classGroups["2A"],
            teachers["Katarzyna Wójcik"],
            rooms["103"]);

        SetClassGroupDetails(
            classGroups["2B"],
            teachers["Piotr Kamiński"],
            rooms["104"]);

        SetClassGroupDetails(
            classGroups["3A"],
            teachers["Magdalena Lewandowska"],
            rooms["201"]);

        SetClassGroupDetails(
            classGroups["3B"],
            teachers["Robert Dąbrowski"],
            rooms["202"]);

        SetClassGroupDetails(
            classGroups["4A"],
            teachers["Agnieszka Szymańska"],
            rooms["Physics Lab"]);

        SetClassGroupDetails(
            classGroups["4B"],
            teachers["Monika Kozłowska"],
            rooms["Chemistry Lab"]);
    }

    private static void SetClassGroupDetails(
        ClassGroup classGroup,
        Teacher homeroomTeacher,
        Room defaultRoom)
    {
        classGroup.HomeroomTeacher = homeroomTeacher;
        classGroup.DefaultRoom = defaultRoom;
        classGroup.Info =
            $"Demo information for class {classGroup.Name}.";
    }

    private static void AddHardClassRequirements(
        int organizationId,
        ClassGroup classGroup,
        IReadOnlyDictionary<string, Teacher> teachers,
        IReadOnlyDictionary<string, Subject> subjects,
        ICollection<LessonRequirement> requirements)
    {
        var grade = GetGradeNumber(classGroup.Name);

        var mathematicsTeacher =
            grade <= 2
                ? teachers["Anna Kowalska"]
                : teachers["Marek Wiśniewski"];

        var polishTeacher =
            grade <= 2
                ? teachers["Joanna Nowak"]
                : teachers["Tomasz Zieliński"];

        var englishTeacher =
            grade <= 2
                ? teachers["Katarzyna Wójcik"]
                : teachers["Piotr Kamiński"];

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Mathematics"],
                mathematicsTeacher,
                4)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Polish"],
                polishTeacher,
                4)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["English"],
                englishTeacher,
                3)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["History"],
                teachers["Magdalena Lewandowska"],
                2)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Geography"],
                teachers["Robert Dąbrowski"],
                2)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Biology"],
                teachers["Agnieszka Szymańska"],
                2)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Physics"],
                teachers["Paweł Woźniak"],
                grade >= 3 ? 2 : 1)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Chemistry"],
                teachers["Monika Kozłowska"],
                grade >= 3 ? 2 : 1)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Computer Science"],
                teachers["Krzysztof Jankowski"],
                2)
        );

        requirements.Add(
            CreateRequirement(
                organizationId,
                classGroup,
                subjects["Physical Education"],
                teachers["Robert Dąbrowski"],
                3)
        );
    }

    private static LessonRequirement CreateRequirement(
        int organizationId,
        ClassGroup classGroup,
        Subject subject,
        Teacher teacher,
        int hoursPerWeek)
    {
        return new LessonRequirement
        {
            OrganizationId = organizationId,
            ClassGroupId = classGroup.Id,
            SubjectId = subject.Id,
            TeacherId = teacher.Id,
            HoursPerWeek = hoursPerWeek
        };
    }

    private static Dictionary<string, Teacher> CreateTeachers(
        int organizationId,
        IEnumerable<string> names)
    {
        return names
            .Select((name, index) => new
            {
                Name = name,
                Teacher = new Teacher
                {
                    TeacherNumber = index + 1,
                    Name = name,
                    Alias = GenerateAlias(name, index + 1),
                    Info = null,
                    OrganizationId = organizationId
                }
            })
            .ToDictionary(
                x => x.Name,
                x => x.Teacher);
    }

    private static Dictionary<string, ClassGroup>
        CreateClassGroups(
            int organizationId,
            IEnumerable<string> names)
    {
        return names.ToDictionary(
            name => name,
            name => new ClassGroup
            {
                Name = name,
                OrganizationId = organizationId
            });
    }

    private static Dictionary<string, Subject> CreateSubjects(
        int organizationId,
        IEnumerable<string> names)
    {
        return names.ToDictionary(
            name => name,
            name => new Subject
            {
                Name = name,
                OrganizationId = organizationId
            });
    }

    private static Dictionary<string, Room> CreateRooms(
        int organizationId,
        IEnumerable<string> names)
    {
        return names.ToDictionary(
            name => name,
            name => new Room
            {
                Name = name,
                OrganizationId = organizationId
            });
    }

    private static int GetGradeNumber(string className)
    {
        if (string.IsNullOrWhiteSpace(className) ||
            !char.IsDigit(className[0]))
        {
            throw new ArgumentException(
                $"Invalid class name: '{className}'.",
                nameof(className)
            );
        }

        return className[0] - '0';
    }

    private static string GenerateAlias(
        string name,
        int teacherNumber)
    {
        var parts = name
            .Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries |
                StringSplitOptions.TrimEntries);

        var initials = string.Concat(
            parts.Select(part =>
                char.ToUpperInvariant(part[0])));

        return $"{initials}{teacherNumber}";
    }
}