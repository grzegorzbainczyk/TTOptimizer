namespace TTOptimizer.Web.Models.Domain
{
    public class AppUserOrganization
    {
        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; } = null!;

        public int OrganizationId { get; set; }
        public Organization Organization { get; set; } = null!;

        public string Role { get; set; } = "Member";
    }
}