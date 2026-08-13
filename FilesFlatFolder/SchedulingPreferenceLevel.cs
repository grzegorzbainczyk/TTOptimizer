using System.Text.Json.Serialization;

namespace TTOptimizer.Web.Models.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SchedulingPreferenceLevel
{
    Disabled,
    Low,
    Medium,
    High,
    Hard
}
