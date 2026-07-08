using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Services
{
    public static class DatabaseSeeder
    {
        public static async Task SeedDemoDataAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();

            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await dbContext.Database.MigrateAsync();

            var existingDemoUser = await dbContext.AppUsers
                .FirstOrDefaultAsync(x => x.UserName == "demo@ttorganizer.local");

            if (existingDemoUser != null)
            {
                return;
            }

            var demoUser = new AppUser
            {
                UserName = "demo@ttorganizer.local",
                DisplayName = "Demo User"
            };

            var demoOrganization = new Organization
            {
                Name = "Demo School"
            };

            dbContext.AppUsers.Add(demoUser);
            dbContext.Organizations.Add(demoOrganization);

            await dbContext.SaveChangesAsync();

            dbContext.AppUserOrganizations.Add(new AppUserOrganization
            {
                AppUserId = demoUser.Id,
                OrganizationId = demoOrganization.Id,
                Role = "Owner"
            });

            await dbContext.SaveChangesAsync();

            var math = new Subject
            {
                OrganizationId = demoOrganization.Id,
                Name = "Mathematics"
            };

            var english = new Subject
            {
                OrganizationId = demoOrganization.Id,
                Name = "English"
            };

            var physics = new Subject
            {
                OrganizationId = demoOrganization.Id,
                Name = "Physics"
            };

            var teacher1 = new Teacher
            {
                OrganizationId = demoOrganization.Id,
                Name = "Anna Kowalska"
            };

            var teacher2 = new Teacher
            {
                OrganizationId = demoOrganization.Id,
                Name = "Jan Nowak"
            };

            var teacher3 = new Teacher
            {
                OrganizationId = demoOrganization.Id,
                Name = "Piotr Zielinski"
            };

            var class1A = new ClassGroup
            {
                OrganizationId = demoOrganization.Id,
                Name = "1A"
            };

            var class1B = new ClassGroup
            {
                OrganizationId = demoOrganization.Id,
                Name = "1B"
            };

            var room101 = new Room
            {
                OrganizationId = demoOrganization.Id,
                Name = "101"
            };

            var room102 = new Room
            {
                OrganizationId = demoOrganization.Id,
                Name = "102"
            };

            var room201 = new Room
            {
                OrganizationId = demoOrganization.Id,
                Name = "201"
            };

            dbContext.Subjects.AddRange(math, english, physics);
            dbContext.Teachers.AddRange(teacher1, teacher2, teacher3);
            dbContext.ClassGroups.AddRange(class1A, class1B);
            dbContext.Rooms.AddRange(room101, room102, room201);

            await dbContext.SaveChangesAsync();

            dbContext.LessonRequirements.AddRange(
                new LessonRequirement
                {
                    OrganizationId = demoOrganization.Id,
                    ClassGroupId = class1A.Id,
                    SubjectId = math.Id,
                    TeacherId = teacher1.Id,
                    HoursPerWeek = 4
                },
                new LessonRequirement
                {
                    OrganizationId = demoOrganization.Id,
                    ClassGroupId = class1A.Id,
                    SubjectId = english.Id,
                    TeacherId = teacher2.Id,
                    HoursPerWeek = 3
                },
                new LessonRequirement
                {
                    OrganizationId = demoOrganization.Id,
                    ClassGroupId = class1A.Id,
                    SubjectId = physics.Id,
                    TeacherId = teacher3.Id,
                    HoursPerWeek = 2
                },
                new LessonRequirement
                {
                    OrganizationId = demoOrganization.Id,
                    ClassGroupId = class1B.Id,
                    SubjectId = math.Id,
                    TeacherId = teacher1.Id,
                    HoursPerWeek = 4
                },
                new LessonRequirement
                {
                    OrganizationId = demoOrganization.Id,
                    ClassGroupId = class1B.Id,
                    SubjectId = english.Id,
                    TeacherId = teacher2.Id,
                    HoursPerWeek = 3
                }
            );

            await dbContext.SaveChangesAsync();
        }
    }
}