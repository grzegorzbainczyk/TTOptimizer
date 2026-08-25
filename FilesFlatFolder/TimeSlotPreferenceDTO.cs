using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.ResourceTimeSlotPreferences;

public class TimeSlotPreferenceDTO
{
    public int DayIndex { get; set; }

    public int SlotIndex { get; set; }

    public TimeSlotPreferenceType PreferenceType { get; set; }
}

public class UpdateTimeSlotPreferencesRequest
{
    public List<TimeSlotPreferenceDTO> TimeSlotPreferences { get; set; } = [];
}
