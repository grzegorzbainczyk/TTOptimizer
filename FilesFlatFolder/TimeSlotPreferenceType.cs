using System.Text.Json.Serialization;

namespace TTOptimizer.Web.Models.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TimeSlotPreferenceType
{
    Preferred,
    NotPreferred,
    Unavailable
}
