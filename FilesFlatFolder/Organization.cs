namespace TTOptimizer.Web.Models.Domain
{
    public class Organization
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Address { get; set; }

        public string? DirectorName { get; set; }

        public List<AppUserOrganization> AppUserOrganizations { get; set; } = new();

        public List<Teacher> Teachers { get; set; } = new();

        public List<ClassGroup> ClassGroups { get; set; } = new();

        public List<Subject> Subjects { get; set; } = new();

        public List<Room> Rooms { get; set; } = new();

        public List<LessonRequirement> LessonRequirements { get; set; } = new();

        public List<StudentGroup> StudentGroups { get; set; } = new();

        public List<StudentGroupDivision> StudentGroupDivisions { get; set; } = new();

        public List<OptimizationRun> OptimizationRuns { get; set; } = new();
    }
}