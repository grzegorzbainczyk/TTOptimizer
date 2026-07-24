using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Data
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
        public DbSet<ScheduleConstraint> ScheduleConstraints { get; set; }

        public DbSet<TeacherUnavailability> TeacherUnavailabilities { get; set; }
        public DbSet<ClassGroupUnavailability> ClassGroupUnavailabilities { get; set; }
        public DbSet<RoomUnavailability> RoomUnavailabilities { get; set; }

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

            modelBuilder.Entity<Teacher>(entity =>
            {
                entity.Property(t => t.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(t => t.Alias)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.Property(t => t.Info)
                    .HasMaxLength(2000);

                entity.HasIndex(t => new
                {
                    t.OrganizationId,
                    t.TeacherNumber
                })
                .IsUnique();

                entity.HasIndex(t => new
                {
                    t.OrganizationId,
                    t.Alias
                })
                .IsUnique();
            });

            modelBuilder.Entity<ClassGroup>(entity =>
            {
                entity.Property(classGroup => classGroup.Name)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(classGroup => classGroup.Info)
                    .HasMaxLength(2000);

                entity.HasIndex(classGroup => new
                {
                    classGroup.OrganizationId,
                    classGroup.Name
                })
                .IsUnique();

                entity.HasOne(classGroup => classGroup.HomeroomTeacher)
                    .WithMany()
                    .HasForeignKey(classGroup => classGroup.HomeroomTeacherId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(classGroup => classGroup.DefaultRoom)
                    .WithMany()
                    .HasForeignKey(classGroup => classGroup.DefaultRoomId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Subject>(entity =>
            {
                entity.Property(subject => subject.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(subject => subject.Info)
                    .HasMaxLength(2000);

                entity.HasIndex(subject => new
                {
                    subject.OrganizationId,
                    subject.Name
                })
                .IsUnique();
            });

            modelBuilder.Entity<Room>(entity =>
            {
                entity.Property(room => room.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(room => room.Info)
                    .HasMaxLength(2000);

                entity.HasIndex(room => new
                {
                    room.OrganizationId,
                    room.Name
                })
                .IsUnique();

                entity.HasOne(room => room.RestrictedToSubject)
                    .WithMany()
                    .HasForeignKey(room => room.RestrictedToSubjectId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(room => room.PreferredSubject)
                    .WithMany()
                    .HasForeignKey(room => room.PreferredSubjectId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<LessonRequirement>()
                .Property(x => x.HoursPerWeek)
                .IsRequired();

            modelBuilder.Entity<OptimizationRun>()
                .Property(x => x.CreatedAtUtc)
                .IsRequired();

            modelBuilder.Entity<ScheduleConstraint>(entity =>
            {
                entity.Property(x => x.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(x => x.Description)
                    .HasMaxLength(1000);

                entity.Property(x => x.ConstraintType)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.TargetType)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.Value)
                    .HasMaxLength(500);

                entity.Property(x => x.IsHard)
                    .HasDefaultValue(true);

                entity.Property(x => x.Weight)
                    .HasDefaultValue(100);

                entity.Property(x => x.IsActive)
                    .HasDefaultValue(true);

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(x => x.Organization)
                    .WithMany()
                    .HasForeignKey(x => x.OrganizationId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TeacherUnavailability>(entity =>
            {
                entity.HasIndex(item => new
                {
                    item.TeacherId,
                    item.DayIndex,
                    item.SlotIndex
                })
                .IsUnique();

                entity.HasOne(item => item.Teacher)
                    .WithMany()
                    .HasForeignKey(item => item.TeacherId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ClassGroupUnavailability>(entity =>
            {
                entity.HasIndex(item => new
                {
                    item.ClassGroupId,
                    item.DayIndex,
                    item.SlotIndex
                })
                .IsUnique();

                entity.HasOne(item => item.ClassGroup)
                    .WithMany()
                    .HasForeignKey(item => item.ClassGroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<RoomUnavailability>(entity =>
            {
                entity.HasIndex(item => new
                {
                    item.RoomId,
                    item.DayIndex,
                    item.SlotIndex
                })
                .IsUnique();

                entity.HasOne(item => item.Room)
                    .WithMany()
                    .HasForeignKey(item => item.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TeacherUnavailability>()
            .ToTable(table =>
            table.HasCheckConstraint(
                "CK_TeacherUnavailability_DayIndex",
                "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4"
        )
    );
        }
    }
}