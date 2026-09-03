using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Data;

public class DemoDataSeeder
{
    private const string EmptyDemoOrganizationName =
        "Pusta szkoła - demo";

    private const string SmallDemoOrganizationName =
        "Mała szkoła - demo";

    private const string PrimarySchoolDemoOrganizationName =
        "Szkoła podstawowa - demo";

    private readonly AppDbContext _context;

    public DemoDataSeeder(AppDbContext context)
    {
        _context = context;
    }

    public Task<int> EnsureEmptyDemoDataAsync()
    {
        return GetOrCreateOrganizationAsync(
            EmptyDemoOrganizationName
        );
    }

    public async Task<int> EnsureSmallDemoDataAsync()
    {
        var organizationId =
            await GetOrCreateOrganizationAsync(
                SmallDemoOrganizationName
            );

        if (!await DemoDataExistsAsync(organizationId))
        {
            await CreateSmallDemoDataAsync(organizationId);
        }

        return organizationId;
    }

    public async Task<int> EnsurePrimarySchoolDemoDataAsync()
    {
        var organizationId =
            await GetOrCreateOrganizationAsync(
                PrimarySchoolDemoOrganizationName
            );

        if (!await DemoDataExistsAsync(organizationId))
        {
            await CreatePrimarySchoolDemoDataAsync(organizationId);
        }

        return organizationId;
    }

    public async Task<int> ResetSmallDemoDataAsync()
    {
        var organizationId =
            await GetOrCreateOrganizationAsync(
                SmallDemoOrganizationName
            );

        await ClearDemoDataAsync(organizationId);
        await CreateSmallDemoDataAsync(organizationId);

        return organizationId;
    }

    public async Task<int> ResetPrimarySchoolDemoDataAsync()
    {
        var organizationId =
            await GetOrCreateOrganizationAsync(
                PrimarySchoolDemoOrganizationName
            );

        await ClearDemoDataAsync(organizationId);
        await CreatePrimarySchoolDemoDataAsync(organizationId);

        return organizationId;
    }

    private Task<bool> DemoDataExistsAsync(int organizationId)
    {
        return _context.Teachers.AnyAsync(
            teacher =>
                teacher.OrganizationId == organizationId
        );
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

    private async Task<SchoolUnit> GetOrCreateDemoSchoolUnitAsync(
        int organizationId)
    {
        var schoolUnit = await _context.SchoolUnits
            .Where(x => x.OrganizationId == organizationId)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync();

        if (schoolUnit != null)
        {
            return schoolUnit;
        }

        var organizationName = await _context.Organizations
            .Where(x => x.Id == organizationId)
            .Select(x => x.Name)
            .SingleAsync();

        schoolUnit = new SchoolUnit
        {
            OrganizationId = organizationId,
            Name = organizationName,
            SchoolType = SchoolType.PrimarySchool
        };

        _context.SchoolUnits.Add(schoolUnit);
        await _context.SaveChangesAsync();

        return schoolUnit;
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

        var buildings = await _context.Buildings
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
        _context.Buildings.RemoveRange(buildings);
        _context.Subjects.RemoveRange(subjects);
        _context.Teachers.RemoveRange(teachers);

        await _context.SaveChangesAsync();
    }

    private async Task CreateSmallDemoDataAsync(
        int organizationId)
    {
        var schoolUnit =
            await GetOrCreateDemoSchoolUnitAsync(organizationId);

        var anna = new Teacher
        {
            TeacherNumber = 1,
            Name = "Anna Kowalska",
            Alias = "AK",
            Info = "Preferuje lekcje poranne.",
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

        var mainBuilding = new Building
        {
            Name = "Budynek główny",
            OrganizationId = organizationId
        };

        var room101 = new Room
        {
            Name = "101",
            Building = mainBuilding,
            OrganizationId = organizationId
        };

        var room102 = new Room
        {
            Name = "102",
            Building = mainBuilding,
            OrganizationId = organizationId
        };

        var class1A = new ClassGroup
        {
            Name = "1A",
            Info = "Sala macierzysta klasy 1A.",
            HomeroomTeacher = anna,
            DefaultRoom = room101,
            OrganizationId = organizationId,
            SchoolUnitId = schoolUnit.Id
        };

        var class1B = new ClassGroup
        {
            Name = "1B",
            Info = "Sala macierzysta klasy 1B.",
            HomeroomTeacher = jan,
            DefaultRoom = room102,
            OrganizationId = organizationId,
            SchoolUnitId = schoolUnit.Id
        };

        var mathematics = new Subject
        {
            Name = "Matematyka",
            OrganizationId = organizationId
        };

        var polish = new Subject
        {
            Name = "Język polski",
            OrganizationId = organizationId
        };

        var english = new Subject
        {
            Name = "Język angielski",
            OrganizationId = organizationId
        };

        _context.Teachers.AddRange(
            anna,
            jan,
            piotr
        );

        _context.Buildings.Add(mainBuilding);

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

    private async Task CreatePrimarySchoolDemoDataAsync(
        int organizationId)
    {
        var schoolUnit =
            await GetOrCreateDemoSchoolUnitAsync(organizationId);

        var teachers = CreateTeachers(
            organizationId,
            new[]
            {
                "Anna Bursztynowicz",
                "Barbara Chmielowiec",
                "Celina Dobrowolska",
                "Dorota Fijałkowska",
                "Elżbieta Gromnicka",
                "Grażyna Jaroszewicz",
                "Joanna Kordylewska",
                "Katarzyna Leszczyńska",
                "Marek Mioduszewski",
                "Piotr Niedzielski",
                "Agnieszka Orzechowska",
                "Tomasz Pruszyński",
                "Monika Radecka",
                "Paweł Sarnowski",
                "Aleksandra Trzebińska",
                "Robert Uściński",
                "Michał Wierzbicki",
                "Renata Zawadzka",
                "Ewa Białostocka",
                "Krzysztof Czerwiński",
                "Adam Drzewiecki",
                "Łukasz Gronostajski",
                "Andrzej Jastrzębski",
                "Magdalena Kwiecińska",
                "Beata Lubowiecka",
                "Marcin Mroziński",
                "Sylwia Ostrowska",
                "Damian Podgórski",
                "Teresa Różycka",
                "Jan Żurawiecki"
            });

        var classGroups = CreateClassGroups(
            organizationId,
            schoolUnit.Id,
            new[]
            {
                "1A",
                "1B",
                "2A",
                "2B",
                "3A",
                "3B",
                "4A",
                "4B",
                "5A",
                "5B",
                "6A",
                "6B",
                "7A",
                "7B",
                "8A",
                "8B"
            });

        var subjects = CreateSubjects(
            organizationId,
            new[]
            {
                "Edukacja wczesnoszkolna",
                "Język polski",
                "Matematyka",
                "Język angielski",
                "Język niemiecki",
                "Historia",
                "Wiedza o społeczeństwie",
                "Geografia",
                "Przyroda",
                "Biologia",
                "Fizyka",
                "Chemia",
                "Informatyka",
                "Technika",
                "Plastyka",
                "Muzyka",
                "Wychowanie fizyczne",
                "Edukacja dla bezpieczeństwa",
                "Religia",
                "Etyka"
            });

        var mainBuilding = new Building
        {
            Name = "Budynek główny",
            OrganizationId = organizationId
        };

        var rooms = CreateRooms(
            organizationId,
            new[]
            {
                "101",
                "102",
                "103",
                "104",
                "105",
                "106",
                "107",
                "108",
                "201",
                "202",
                "203",
                "204",
                "205",
                "206",
                "207",
                "208",
                "Pracownia komputerowa",
                "Pracownia chemiczna",
                "Sala gimnastyczna"
            });

        foreach (var room in rooms.Values)
        {
            room.Building = mainBuilding;
        }

        ConfigurePrimarySchoolRooms(rooms, subjects);

        ConfigurePrimarySchoolClassGroups(
            classGroups,
            teachers,
            rooms
        );

        _context.Teachers.AddRange(teachers.Values);
        _context.Buildings.Add(mainBuilding);

        _context.Rooms.AddRange(rooms.Values);
        _context.ClassGroups.AddRange(classGroups.Values);
        _context.Subjects.AddRange(subjects.Values);

        await _context.SaveChangesAsync();

        var lessonRequirements =
            new List<LessonRequirement>();

        foreach (var classGroup in classGroups.Values)
        {
            AddPrimarySchoolClassRequirements(
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

    private static void ConfigurePrimarySchoolRooms(
        IReadOnlyDictionary<string, Room> rooms,
        IReadOnlyDictionary<string, Subject> subjects)
    {
        rooms["Sala gimnastyczna"].RestrictedToSubject =
            subjects["Wychowanie fizyczne"];

        rooms["Sala gimnastyczna"].PreferredSubject =
            subjects["Wychowanie fizyczne"];

        rooms["Pracownia chemiczna"].RestrictedToSubject =
            subjects["Chemia"];

        rooms["Pracownia chemiczna"].PreferredSubject =
            subjects["Chemia"];

        rooms["Pracownia komputerowa"].RestrictedToSubject =
            subjects["Informatyka"];

        rooms["Pracownia komputerowa"].PreferredSubject =
            subjects["Informatyka"];
    }

    private static void ConfigurePrimarySchoolClassGroups(
        IDictionary<string, ClassGroup> classGroups,
        IReadOnlyDictionary<string, Teacher> teachers,
        IReadOnlyDictionary<string, Room> rooms)
    {
        SetClassGroupDetails(
            classGroups["1A"],
            teachers["Anna Bursztynowicz"],
            rooms["101"]);

        SetClassGroupDetails(
            classGroups["1B"],
            teachers["Barbara Chmielowiec"],
            rooms["102"]);

        SetClassGroupDetails(
            classGroups["2A"],
            teachers["Celina Dobrowolska"],
            rooms["103"]);

        SetClassGroupDetails(
            classGroups["2B"],
            teachers["Dorota Fijałkowska"],
            rooms["104"]);

        SetClassGroupDetails(
            classGroups["3A"],
            teachers["Elżbieta Gromnicka"],
            rooms["105"]);

        SetClassGroupDetails(
            classGroups["3B"],
            teachers["Grażyna Jaroszewicz"],
            rooms["106"]);

        SetClassGroupDetails(
            classGroups["4A"],
            teachers["Joanna Kordylewska"],
            rooms["107"]);

        SetClassGroupDetails(
            classGroups["4B"],
            teachers["Katarzyna Leszczyńska"],
            rooms["108"]);

        var olderClasses = new[]
        {
            ("5A", "201", "Marek Mioduszewski"),
            ("5B", "202", "Piotr Niedzielski"),
            ("6A", "203", "Agnieszka Orzechowska"),
            ("6B", "204", "Tomasz Pruszyński"),
            ("7A", "205", "Monika Radecka"),
            ("7B", "206", "Paweł Sarnowski"),
            ("8A", "207", "Aleksandra Trzebińska"),
            ("8B", "208", "Michał Wierzbicki")
        };

        foreach (var (className, roomName, teacherName) in olderClasses)
        {
            SetClassGroupDetails(
                classGroups[className],
                teachers[teacherName],
                rooms[roomName]);
        }

        foreach (var classGroup in classGroups.Values)
        {
            classGroup.Grade = GetGradeNumber(classGroup.Name);
            classGroup.IsEarlyEducation = classGroup.Grade <= 3;
        }
    }

    private static void SetClassGroupDetails(
        ClassGroup classGroup,
        Teacher homeroomTeacher,
        Room defaultRoom)
    {
        classGroup.HomeroomTeacher = homeroomTeacher;
        classGroup.DefaultRoom = defaultRoom;
        classGroup.Info =
            $"Dane demonstracyjne klasy {classGroup.Name}.";
    }

    private static void AddPrimarySchoolClassRequirements(
        int organizationId,
        ClassGroup classGroup,
        IReadOnlyDictionary<string, Teacher> teachers,
        IReadOnlyDictionary<string, Subject> subjects,
        ICollection<LessonRequirement> requirements)
    {
        var grade = GetGradeNumber(classGroup.Name);

        if (grade <= 3)
        {
            var earlyEducationTeachers = new[]
            {
                "Anna Bursztynowicz",
                "Barbara Chmielowiec",
                "Celina Dobrowolska",
                "Dorota Fijałkowska",
                "Elżbieta Gromnicka",
                "Grażyna Jaroszewicz"
            };

            var teacherIndex = (grade - 1) * 2 +
                (classGroup.Name.EndsWith("B") ? 1 : 0);

            AddRequirement("Edukacja wczesnoszkolna",
                earlyEducationTeachers[teacherIndex], 18);
            AddRequirement("Język angielski",
                classGroup.Name.EndsWith("A")
                    ? "Monika Radecka"
                    : "Paweł Sarnowski", 2);
            AddRequirement("Wychowanie fizyczne",
                classGroup.Name.EndsWith("A")
                    ? "Marcin Mroziński"
                    : "Sylwia Ostrowska", 3);
            AddRequirement("Religia", "Teresa Różycka", 1);
            return;
        }

        var classIndex = (grade - 4) * 2 +
            (classGroup.Name.EndsWith("B") ? 1 : 0);

        AddRequirement("Język polski",
            new[] { "Joanna Kordylewska", "Katarzyna Leszczyńska", "Marek Mioduszewski" }[classIndex % 3], 5);
        AddRequirement("Matematyka",
            new[] { "Piotr Niedzielski", "Agnieszka Orzechowska", "Tomasz Pruszyński" }[classIndex % 3], 4);
        AddRequirement("Język angielski",
            new[] { "Monika Radecka", "Paweł Sarnowski", "Aleksandra Trzebińska" }[classIndex % 3], 3);
        AddRequirement("Historia", "Michał Wierzbicki", 2);
        AddRequirement("Geografia", "Renata Zawadzka", 1);
        AddRequirement("Biologia", "Ewa Białostocka", 1);
        AddRequirement("Informatyka", "Łukasz Gronostajski", 1);
        AddRequirement("Wychowanie fizyczne",
            new[] { "Marcin Mroziński", "Sylwia Ostrowska", "Damian Podgórski" }[classIndex % 3], 4);
        AddRequirement("Religia", "Teresa Różycka", 1);

        if (grade == 4)
        {
            AddRequirement("Przyroda", "Renata Zawadzka", 2);
        }

        if (grade <= 6)
        {
            AddRequirement("Technika", "Andrzej Jastrzębski", 1);
        }

        if (grade <= 7)
        {
            AddRequirement("Plastyka", "Magdalena Kwiecińska", 1);
            AddRequirement("Muzyka", "Beata Lubowiecka", 1);
        }

        if (grade >= 7)
        {
            AddRequirement("Język niemiecki", "Robert Uściński", 2);
            AddRequirement("Fizyka", "Adam Drzewiecki", 2);
            AddRequirement("Chemia", "Krzysztof Czerwiński", 2);
        }

        if (grade == 8)
        {
            AddRequirement("Wiedza o społeczeństwie", "Michał Wierzbicki", 2);
            AddRequirement("Edukacja dla bezpieczeństwa", "Damian Podgórski", 1);
        }

        void AddRequirement(
            string subjectName,
            string teacherName,
            int hoursPerWeek)
        {
            requirements.Add(
                CreateRequirement(
                    organizationId,
                    classGroup,
                    subjects[subjectName],
                    teachers[teacherName],
                    hoursPerWeek)
            );
        }
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
            int schoolUnitId,
            IEnumerable<string> names)
    {
        return names.ToDictionary(
            name => name,
            name => new ClassGroup
            {
                Name = name,
                OrganizationId = organizationId,
                SchoolUnitId = schoolUnitId
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
