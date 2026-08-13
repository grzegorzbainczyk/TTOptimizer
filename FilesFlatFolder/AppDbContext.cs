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

        public DbSet<StudentGroup> StudentGroups => Set<StudentGroup>();
        public DbSet<StudentGroupDivision> StudentGroupDivisions => Set<StudentGroupDivision>();
        public DbSet<StudentGroupMember> StudentGroupMembers => Set<StudentGroupMember>();

        public DbSet<OptimizationRun> OptimizationRuns => Set<OptimizationRun>();
        public DbSet<ScheduledLesson> ScheduledLessons => Set<ScheduledLesson>();
        public DbSet<ScheduleConstraint> ScheduleConstraints { get; set; }

        public DbSet<TeacherTimeSlotPreference> TeacherTimeSlotPreferences { get; set; }
        public DbSet<ClassGroupTimeSlotPreference> ClassGroupTimeSlotPreferences { get; set; }
        public DbSet<RoomTimeSlotPreference> RoomTimeSlotPreferences { get; set; }
        public DbSet<SubjectTimeSlotPreference> SubjectTimeSlotPreferences { get; set; }

        public DbSet<OrganizationSchedulingPreferences> OrganizationSchedulingPreferences { get; set; }
        public DbSet<TeacherSchedulingPreferences> TeacherSchedulingPreferences { get; set; }
        public DbSet<ClassGroupSchedulingPreferences> ClassGroupSchedulingPreferences { get; set; }
        public DbSet<SubjectSchedulingPreferences> SubjectSchedulingPreferences { get; set; }

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

            modelBuilder.Entity<Organization>(entity =>
            {
                entity.Property(x => x.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(x => x.Address)
                    .HasMaxLength(500);

                entity.Property(x => x.DirectorName)
                    .HasMaxLength(200);
            });

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

            modelBuilder.Entity<StudentGroupDivision>(entity =>
            {
                entity.Property(item => item.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasIndex(item => new { item.ClassGroupId, item.Name })
                    .IsUnique();

                entity.HasOne(item => item.Organization)
                    .WithMany(item => item.StudentGroupDivisions)
                    .HasForeignKey(item => item.OrganizationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(item => item.ClassGroup)
                    .WithMany()
                    .HasForeignKey(item => item.ClassGroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentGroup>(entity =>
            {
                entity.Property(item => item.Name)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.HasIndex(item => new { item.OrganizationId, item.Name })
                    .IsUnique();

                entity.HasIndex(item => item.ClassGroupId)
                    .IsUnique()
                    .HasFilter("\"Type\" = 0");

                entity.HasOne(item => item.Organization)
                    .WithMany(item => item.StudentGroups)
                    .HasForeignKey(item => item.OrganizationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(item => item.ClassGroup)
                    .WithMany(item => item.StudentGroups)
                    .HasForeignKey(item => item.ClassGroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(item => item.Division)
                    .WithMany(item => item.StudentGroups)
                    .HasForeignKey(item => item.DivisionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentGroupMember>(entity =>
            {
                entity.HasKey(item => new
                {
                    item.StudentGroupId,
                    item.MemberGroupId
                });

                entity.HasOne(item => item.StudentGroup)
                    .WithMany(item => item.Members)
                    .HasForeignKey(item => item.StudentGroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(item => item.MemberGroup)
                    .WithMany(item => item.MemberOf)
                    .HasForeignKey(item => item.MemberGroupId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<LessonRequirement>(entity =>
            {
                entity.Property(item => item.HoursPerWeek)
                    .IsRequired();

                entity.HasOne(item => item.StudentGroup)
                    .WithMany()
                    .HasForeignKey(item => item.StudentGroupId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(item => item.ClassGroup)
                    .WithMany()
                    .HasForeignKey(item => item.ClassGroupId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

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

            modelBuilder.Entity<OrganizationSchedulingPreferences>(entity =>
            {
                entity.HasIndex(item => item.OrganizationId)
                    .IsUnique();

                entity.HasOne(item => item.Organization)
                    .WithMany()
                    .HasForeignKey(item => item.OrganizationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(item => item.TeacherMinimizeGaps)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.TeacherAvoidSingleLessonDay)
                    .HasDefaultValue(SchedulingPreferenceLevel.Low);

                entity.Property(item => item.TeacherMaxConsecutiveLessons)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.TeacherMaxConsecutiveLessonsLimit)
                    .HasDefaultValue(4);

                entity.Property(item => item.TeacherMaxLessonsPerDay)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.TeacherMaxLessonsPerDayLimit)
                    .HasDefaultValue(6);

                entity.Property(item => item.ClassGroupMinimizeGaps)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.ClassGroupAvoidSingleLessonDay)
                    .HasDefaultValue(SchedulingPreferenceLevel.Disabled);

                entity.Property(item => item.ClassGroupMaxConsecutiveLessons)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.ClassGroupMaxConsecutiveLessonsLimit)
                    .HasDefaultValue(6);

                entity.Property(item => item.ClassGroupMaxLessonsPerDay)
                    .HasDefaultValue(SchedulingPreferenceLevel.High);

                entity.Property(item => item.ClassGroupMaxLessonsPerDayLimit)
                    .HasDefaultValue(8);

                entity.Property(item => item.SubjectSpreadAcrossDays)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.SubjectMaxOccurrencesPerDay)
                    .HasDefaultValue(SchedulingPreferenceLevel.Medium);

                entity.Property(item => item.SubjectMaxOccurrencesPerDayLimit)
                    .HasDefaultValue(1);

                entity.Property(item => item.SubjectPreferDoubleLessons)
                    .HasDefaultValue(SchedulingPreferenceLevel.Disabled);

                entity.Property(item => item.SubjectAvoidDoubleLessons)
                    .HasDefaultValue(SchedulingPreferenceLevel.Disabled);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_OrganizationSchedulingPreferences_MaxConsecutiveLessonsLimit",
                        "\"TeacherMaxConsecutiveLessonsLimit\" >= 1 AND \"TeacherMaxConsecutiveLessonsLimit\" <= 8");

                    table.HasCheckConstraint(
                        "CK_OrganizationSchedulingPreferences_MaxLessonsPerDayLimit",
                        "\"TeacherMaxLessonsPerDayLimit\" >= 1 AND \"TeacherMaxLessonsPerDayLimit\" <= 8");

                    table.HasCheckConstraint(
                        "CK_OrganizationSchedulingPreferences_ClassGroupMaxConsecutiveLessonsLimit",
                        "\"ClassGroupMaxConsecutiveLessonsLimit\" >= 1 AND \"ClassGroupMaxConsecutiveLessonsLimit\" <= 8");

                    table.HasCheckConstraint(
                        "CK_OrganizationSchedulingPreferences_ClassGroupMaxLessonsPerDayLimit",
                        "\"ClassGroupMaxLessonsPerDayLimit\" >= 1 AND \"ClassGroupMaxLessonsPerDayLimit\" <= 8");

                    table.HasCheckConstraint(
                        "CK_OrganizationSchedulingPreferences_SubjectMaxOccurrencesPerDayLimit",
                        "\"SubjectMaxOccurrencesPerDayLimit\" >= 1 AND \"SubjectMaxOccurrencesPerDayLimit\" <= 8");
                });
            });

            modelBuilder.Entity<TeacherSchedulingPreferences>(entity =>
            {
                entity.HasIndex(item => item.TeacherId)
                    .IsUnique();

                entity.HasOne(item => item.Teacher)
                    .WithMany()
                    .HasForeignKey(item => item.TeacherId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_TeacherSchedulingPreferences_MaxConsecutiveLessonsLimit",
                        "\"MaxConsecutiveLessonsLimit\" IS NULL OR (\"MaxConsecutiveLessonsLimit\" >= 1 AND \"MaxConsecutiveLessonsLimit\" <= 8)");

                    table.HasCheckConstraint(
                        "CK_TeacherSchedulingPreferences_MaxLessonsPerDayLimit",
                        "\"MaxLessonsPerDayLimit\" IS NULL OR (\"MaxLessonsPerDayLimit\" >= 1 AND \"MaxLessonsPerDayLimit\" <= 8)");
                });
            });

            modelBuilder.Entity<ClassGroupSchedulingPreferences>(entity =>
            {
                entity.HasIndex(item => item.ClassGroupId)
                    .IsUnique();

                entity.HasOne(item => item.ClassGroup)
                    .WithMany()
                    .HasForeignKey(item => item.ClassGroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_ClassGroupSchedulingPreferences_MaxConsecutiveLessonsLimit",
                        "\"MaxConsecutiveLessonsLimit\" IS NULL OR (\"MaxConsecutiveLessonsLimit\" >= 1 AND \"MaxConsecutiveLessonsLimit\" <= 8)");

                    table.HasCheckConstraint(
                        "CK_ClassGroupSchedulingPreferences_MaxLessonsPerDayLimit",
                        "\"MaxLessonsPerDayLimit\" IS NULL OR (\"MaxLessonsPerDayLimit\" >= 1 AND \"MaxLessonsPerDayLimit\" <= 8)");
                });
            });

            modelBuilder.Entity<SubjectSchedulingPreferences>(entity =>
            {
                entity.HasIndex(item => item.SubjectId)
                    .IsUnique();

                entity.HasOne(item => item.Subject)
                    .WithMany()
                    .HasForeignKey(item => item.SubjectId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_SubjectSchedulingPreferences_MaxOccurrencesPerDayLimit",
                        "\"MaxOccurrencesPerDayLimit\" IS NULL OR (\"MaxOccurrencesPerDayLimit\" >= 1 AND \"MaxOccurrencesPerDayLimit\" <= 8)");
                });
            });

            modelBuilder.Entity<TeacherTimeSlotPreference>(entity =>
            {
                entity.HasIndex(item => new { item.TeacherId, item.DayIndex, item.SlotIndex })
                    .IsUnique();

                entity.HasOne(item => item.Teacher)
                    .WithMany()
                    .HasForeignKey(item => item.TeacherId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_TeacherTimeSlotPreference_DayIndex",
                        "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");

                    table.HasCheckConstraint(
                        "CK_TeacherTimeSlotPreference_SlotIndex",
                        "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                });
            });

            modelBuilder.Entity<ClassGroupTimeSlotPreference>(entity =>
            {
                entity.HasIndex(item => new { item.ClassGroupId, item.DayIndex, item.SlotIndex })
                    .IsUnique();

                entity.HasOne(item => item.ClassGroup)
                    .WithMany()
                    .HasForeignKey(item => item.ClassGroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_ClassGroupTimeSlotPreference_DayIndex",
                        "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");

                    table.HasCheckConstraint(
                        "CK_ClassGroupTimeSlotPreference_SlotIndex",
                        "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                });
            });

            modelBuilder.Entity<RoomTimeSlotPreference>(entity =>
            {
                entity.HasIndex(item => new { item.RoomId, item.DayIndex, item.SlotIndex })
                    .IsUnique();

                entity.HasOne(item => item.Room)
                    .WithMany()
                    .HasForeignKey(item => item.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_RoomTimeSlotPreference_DayIndex",
                        "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");

                    table.HasCheckConstraint(
                        "CK_RoomTimeSlotPreference_SlotIndex",
                        "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                });
            });

            modelBuilder.Entity<SubjectTimeSlotPreference>(entity =>
            {
                entity.HasIndex(item => new { item.SubjectId, item.DayIndex, item.SlotIndex })
                    .IsUnique();

                entity.HasOne(item => item.Subject)
                    .WithMany()
                    .HasForeignKey(item => item.SubjectId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_SubjectTimeSlotPreference_DayIndex",
                        "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");

                    table.HasCheckConstraint(
                        "CK_SubjectTimeSlotPreference_SlotIndex",
                        "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                });
            });
        }
    }
}
