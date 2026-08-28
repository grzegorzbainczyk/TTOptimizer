namespace TTOptimizer.Web.Models.Domain
{
    public class SchoolUnit
    {
        public int Id { get; set; }

        public int OrganizationId { get; set; }

        public string Name { get; set; } = string.Empty;

        public SchoolType SchoolType { get; set; } = SchoolType.Unknown;

        public Organization Organization { get; set; } = null!;

        public List<ClassGroup> ClassGroups { get; set; } = new();
    }
}
