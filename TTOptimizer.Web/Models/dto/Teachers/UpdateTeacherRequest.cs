using System.ComponentModel.DataAnnotations;

namespace TTOptimizer.Web.Models.DTO.Teachers;

public class UpdateTeacherRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Alias { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Info { get; set; }
}