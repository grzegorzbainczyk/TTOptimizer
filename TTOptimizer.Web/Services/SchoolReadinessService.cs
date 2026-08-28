using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.SchoolReadiness;

namespace TTOptimizer.Web.Services;

public class SchoolReadinessService
{
    private const int TotalSteps = 7;
    private readonly AppDbContext _db;

    public SchoolReadinessService(AppDbContext db) => _db = db;

    public async Task<SchoolReadinessDto> GetReadinessAsync(int organizationId)
    {
        var counts = new SchoolReadinessCountsDto
        {
            SchoolUnits = await _db.SchoolUnits.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId),
            SchoolUnitsWithType = await _db.SchoolUnits.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId && x.SchoolType != SchoolType.Unknown),
            Buildings = await _db.Buildings.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId),
            Rooms = await _db.Rooms.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId),
            Subjects = await _db.Subjects.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId),
            Teachers = await _db.Teachers.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId),
            Classes = await _db.ClassGroups.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId),
            Lessons = await _db.LessonRequirements.AsNoTracking().CountAsync(x => x.OrganizationId == organizationId)
        };

        var schoolReady = counts.SchoolUnits > 0 && counts.SchoolUnitsWithType == counts.SchoolUnits;
        var buildingReady = counts.Buildings > 0;
        var roomReady = counts.Rooms > 0;
        var subjectReady = counts.Subjects > 0;
        var teacherReady = counts.Teachers > 0;
        var classReady = counts.Classes > 0;
        var lessonReady = counts.Lessons > 0;

        var foundationReady = schoolReady && buildingReady;
        var canConfigureLessons = foundationReady && subjectReady && teacherReady && classReady;
        var canOptimize = foundationReady && roomReady && subjectReady && teacherReady && classReady && lessonReady;

        var missing = new List<SchoolReadinessStepDto>();
        AddMissing(missing, schoolReady, "school", "Dodaj szkołę i określ jej typ", "Szkoła");
        AddMissing(missing, buildingReady, "buildings", "Dodaj co najmniej jeden budynek", "Budynki");
        AddMissing(missing, roomReady, "rooms", "Dodaj sale", "Sale");
        AddMissing(missing, subjectReady, "subjects", "Dodaj przedmioty", "Przedmioty");
        AddMissing(missing, teacherReady, "teachers", "Dodaj nauczycieli", "Nauczyciele");
        AddMissing(missing, classReady, "classes", "Dodaj klasy", "Klasy");
        AddMissing(missing, lessonReady, "lessons", "Zdefiniuj lekcje", "Lekcje");

        return new SchoolReadinessDto
        {
            FoundationReady = foundationReady,
            CanConfigureLessons = canConfigureLessons,
            CanOptimize = canOptimize,
            CompletedSteps = TotalSteps - missing.Count,
            TotalSteps = TotalSteps,
            Counts = counts,
            MissingSteps = missing
        };
    }

    private static void AddMissing(List<SchoolReadinessStepDto> list, bool ready, string key, string label, string buttonLabel)
    {
        if (ready) return;
        list.Add(new SchoolReadinessStepDto { Key = key, Label = label, ButtonLabel = buttonLabel });
    }
}
