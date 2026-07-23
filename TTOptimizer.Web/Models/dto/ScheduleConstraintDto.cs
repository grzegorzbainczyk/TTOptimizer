namespace TTOptimizer.Web.Models.DTO
{
    public class ScheduleConstraintDto
    {
        public int Id { get; set; }

        public int OrganizationId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string ConstraintType { get; set; } = string.Empty;

        public string TargetType { get; set; } = string.Empty;

        public int TargetId { get; set; }

        public bool IsHard { get; set; }

        public int Weight { get; set; }

        public int? DayOfWeek { get; set; }

        public int? SlotNumber { get; set; }

        public string? Value { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}