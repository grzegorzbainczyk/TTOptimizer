namespace TTOptimizer.Web.Models.Domain
{
    public class AppUser
    {
        public int Id { get; set; }

        public string UserName { get; set; } = string.Empty;

        public string DisplayName { get; set; } = string.Empty;

        public List<AppUserOrganization> AppUserOrganizations { get; set; } = new();

        public List<Teacher> Teachers { get; set; } = new();

        public List<ClassGroup> ClassGroups { get; set; } = new();

        public List<Subject> Subjects { get; set; } = new();

        public List<Room> Rooms { get; set; } = new();

        public List<LessonRequirement> LessonRequirements { get; set; } = new();

        public List<OptimizationRun> OptimizationRuns { get; set; } = new();
    }
}