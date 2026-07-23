namespace TTOptimizer.Web.Models.DTO
{
    public class CreateScheduleConstraintRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string ConstraintType { get; set; } = string.Empty;

        public string TargetType { get; set; } = string.Empty;

        public int TargetId { get; set; }

        public bool IsHard { get; set; } = true;

        public int Weight { get; set; } = 100;

        public int? DayOfWeek { get; set; }

        public int? SlotNumber { get; set; }

        public string? Value { get; set; }

        public bool IsActive { get; set; } = true;
    }
}