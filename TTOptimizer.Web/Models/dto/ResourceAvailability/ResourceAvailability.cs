namespace TTOptimizer.Web.Models.DTO.ResourceAvailability;

public class AvailabilitySlotDTO
{
    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }
}

public class UpdateAvailabilityRequest
{
    public List<AvailabilitySlotDTO> UnavailableSlots { get; set; } = [];
}