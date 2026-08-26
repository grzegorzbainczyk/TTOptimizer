using TTOptimizer.Web.Models.Domain;

namespace TTOptimizer.Web.Models.DTO.SchoolUnits;

public class SchoolUnitDto
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;

    public SchoolType SchoolType { get; set; }
}

public class CreateSchoolUnitRequest
{
    public string Name { get; set; } = string.Empty;

    public SchoolType SchoolType { get; set; }
}

public class UpdateSchoolUnitRequest
{
    public string Name { get; set; } = string.Empty;

    public SchoolType SchoolType { get; set; }
}
