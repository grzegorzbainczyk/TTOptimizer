using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.Organizations;

public class OrganizationDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? DirectorName { get; set; }

    public SchoolType SchoolType { get; set; }
}

public class UpdateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? DirectorName { get; set; }

    public SchoolType SchoolType { get; set; }
}
