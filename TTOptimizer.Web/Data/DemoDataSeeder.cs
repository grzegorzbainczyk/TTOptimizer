using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Data;

public class DemoDataSeeder
{
    private const string DemoOrganizationName = "Demo School";

    private readonly AppDbContext _context;

    public DemoDataSeeder(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> ResetDemoDataAsync()
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Name == DemoOrganizationName);

        if (organization == null)
        {
            organization = new Organization
            {
                Name = DemoOrganizationName
            };

            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();
        }

        var organizationId = organization.Id;

        await ClearDemoDataAsync(organizationId);
        await CreateDemoDataAsync(organizationId);

        return organizationId;
    }

    private async Task ClearDemoDataAsync(int organizationId)
    {
        var lessonRequirements = await _context.LessonRequirements
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

        _context.LessonRequirements.RemoveRange(lessonRequirements);
        _context.Rooms.RemoveRange(rooms);
        _context.Subjects.RemoveRange(subjects);
        _context.ClassGroups.RemoveRange(classGroups);
        _context.Teachers.RemoveRange(teachers);

        await _context.SaveChangesAsync();
    }

    private async Task CreateDemoDataAsync(int organizationId)
    {
        var anna = new Teacher
        {
            Name = "Anna Kowalska",
            OrganizationId = organizationId
        };

        var jan = new Teacher
        {
            Name = "Jan Nowak",
            OrganizationId = organizationId
        };

        var piotr = new Teacher
        {
            Name = "Piotr Zieliński",
            OrganizationId = organizationId
        };

        var class1A = new ClassGroup
        {
            Name = "1A",
            OrganizationId = organizationId
        };

        var class1B = new ClassGroup
        {
            Name = "1B",
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

        _context.Teachers.AddRange(anna, jan, piotr);
        _context.ClassGroups.AddRange(class1A, class1B);
        _context.Subjects.AddRange(mathematics, polish, english);
        _context.Rooms.AddRange(room101, room102);

        await _context.SaveChangesAsync();

        var lessonRequirements = new List<LessonRequirement>
        {
            new()
            {
                OrganizationId = organizationId,
                ClassGroupId = class1A.Id,
                SubjectId = mathematics.Id,
                TeacherId = anna.Id,
                HoursPerWeek = 4
            },
            new()
            {
                OrganizationId = organizationId,
                ClassGroupId = class1A.Id,
                SubjectId = polish.Id,
                TeacherId = jan.Id,
                HoursPerWeek = 3
            },
            new()
            {
                OrganizationId = organizationId,
                ClassGroupId = class1A.Id,
                SubjectId = english.Id,
                TeacherId = piotr.Id,
                HoursPerWeek = 2
            },
            new()
            {
                OrganizationId = organizationId,
                ClassGroupId = class1B.Id,
                SubjectId = mathematics.Id,
                TeacherId = anna.Id,
                HoursPerWeek = 4
            },
            new()
            {
                OrganizationId = organizationId,
                ClassGroupId = class1B.Id,
                SubjectId = polish.Id,
                TeacherId = jan.Id,
                HoursPerWeek = 3
            },
            new()
            {
                OrganizationId = organizationId,
                ClassGroupId = class1B.Id,
                SubjectId = english.Id,
                TeacherId = piotr.Id,
                HoursPerWeek = 2
            }
        };

        _context.LessonRequirements.AddRange(lessonRequirements);

        await _context.SaveChangesAsync();
    }
}