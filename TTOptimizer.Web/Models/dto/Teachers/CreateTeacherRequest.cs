using System.ComponentModel.DataAnnotations;

namespace TTOptimizer.Web.Models.DTO.Teachers;

public class CreateTeacherRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Alias { get; set; }

    [MaxLength(2000)]
    public string? Info { get; set; }
}