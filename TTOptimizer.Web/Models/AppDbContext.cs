using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<AppUser> AppUsers => Set<AppUser>();
        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<AppUserOrganization> AppUserOrganizations => Set<AppUserOrganization>();

        public DbSet<Teacher> Teachers => Set<Teacher>();
        public DbSet<ClassGroup> ClassGroups => Set<ClassGroup>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<Room> Rooms => Set<Room>();

        public DbSet<LessonRequirement> LessonRequirements => Set<LessonRequirement>();

        public DbSet<OptimizationRun> OptimizationRuns => Set<OptimizationRun>();
        public DbSet<ScheduledLesson> ScheduledLessons => Set<ScheduledLesson>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AppUserOrganization>()
                .HasKey(x => new { x.AppUserId, x.OrganizationId });

            modelBuilder.Entity<AppUserOrganization>()
                .HasOne(x => x.AppUser)
                .WithMany(x => x.AppUserOrganizations)
                .HasForeignKey(x => x.AppUserId);

            modelBuilder.Entity<AppUserOrganization>()
                .HasOne(x => x.Organization)
                .WithMany(x => x.AppUserOrganizations)
                .HasForeignKey(x => x.OrganizationId);

            modelBuilder.Entity<AppUser>()
                .Property(x => x.UserName)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<AppUser>()
                .Property(x => x.DisplayName)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<AppUser>()
                .HasIndex(x => x.UserName)
                .IsUnique();

            modelBuilder.Entity<Organization>()
                .Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<AppUserOrganization>()
                .Property(x => x.Role)
                .IsRequired()
                .HasMaxLength(50);

            modelBuilder.Entity<Teacher>()
                .Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<ClassGroup>()
                .Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<Subject>()
                .Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<Room>()
                .Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<LessonRequirement>()
                .Property(x => x.HoursPerWeek)
                .IsRequired();

            modelBuilder.Entity<OptimizationRun>()
                .Property(x => x.CreatedAtUtc)
                .IsRequired();
        }
    }
}