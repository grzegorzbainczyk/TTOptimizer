using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

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