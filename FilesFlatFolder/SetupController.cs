using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/setup")]
public class SetupController : ControllerBase
{
    private readonly AppDbContext _db;

    public SetupController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organizationExists =
            await _db.Organizations
                .AsNoTracking()
                .AnyAsync(item =>
                    item.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var buildingCount =
            await _db.Buildings
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var roomCount =
            await _db.Rooms
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var classCount =
            await _db.ClassGroups
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var subjectCount =
            await _db.Subjects
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var teacherCount =
            await _db.Teachers
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var teacherAssignmentCount =
            await _db.TeacherAssignments
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var classesWithAssignments =
            await _db.TeacherAssignments
                .AsNoTracking()
                .Where(item =>
                    item.OrganizationId == organizationId)
                .Select(item => item.ClassGroupId)
                .Distinct()
                .CountAsync();

        var classesWithoutAssignments =
            Math.Max(
                0,
                classCount - classesWithAssignments);

        var lessonCount =
            await _db.LessonRequirements
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var classesWithLessons =
            await _db.LessonRequirements
                .AsNoTracking()
                .Where(item =>
                    item.OrganizationId == organizationId &&
                    item.ClassGroupId.HasValue)
                .Select(item => item.ClassGroupId!.Value)
                .Distinct()
                .CountAsync();

        var classesWithoutLessons =
            Math.Max(
                0,
                classCount - classesWithLessons);

        var teacherIds =
            _db.Teachers
                .Where(item =>
                    item.OrganizationId == organizationId)
                .Select(item => item.Id);

        var classIds =
            _db.ClassGroups
                .Where(item =>
                    item.OrganizationId == organizationId)
                .Select(item => item.Id);

        var roomIds =
            _db.Rooms
                .Where(item =>
                    item.OrganizationId == organizationId)
                .Select(item => item.Id);

        var teacherAvailabilityCount =
            await _db.TeacherTimeSlotPreferences
                .AsNoTracking()
                .CountAsync(item =>
                    teacherIds.Contains(item.TeacherId));

        var classAvailabilityCount =
            await _db.ClassGroupTimeSlotPreferences
                .AsNoTracking()
                .CountAsync(item =>
                    classIds.Contains(item.ClassGroupId));

        var roomAvailabilityCount =
            await _db.RoomTimeSlotPreferences
                .AsNoTracking()
                .CountAsync(item =>
                    roomIds.Contains(item.RoomId));

        var availabilityRuleCount =
            teacherAvailabilityCount +
            classAvailabilityCount +
            roomAvailabilityCount;

        var optimizationRunCount =
            await _db.OptimizationRuns
                .AsNoTracking()
                .CountAsync(item =>
                    item.OrganizationId == organizationId);

        var buildingsReady =
            buildingCount > 0 &&
            roomCount > 0;

        var classesReady =
            classCount > 0;

        var subjectsReady =
            subjectCount > 0;

        var teachersReady =
            teacherCount > 0;

        var teacherAssignmentsReady =
            classCount > 0 &&
            teacherAssignmentCount > 0 &&
            classesWithoutAssignments == 0;

        var lessonsReady =
            classCount > 0 &&
            lessonCount > 0 &&
            classesWithoutLessons == 0;

        // No availability rows means "no restrictions", which is a valid state.
        // Availability therefore does not block optimization.
        var availabilityReady = true;

        var dataReadyForOptimization =
            buildingsReady &&
            classesReady &&
            subjectsReady &&
            teachersReady &&
            teacherAssignmentsReady &&
            lessonsReady;

        var nextStep =
            !buildingsReady
                ? "rooms"
                : !classesReady
                    ? "classes"
                    : !subjectsReady
                        ? "subjects"
                        : !teachersReady
                            ? "teachers"
                            : !teacherAssignmentsReady
                                ? "teacherAssignments"
                                : !lessonsReady
                                    ? "lessons"
                                    : "optimization";

        return Ok(new
        {
            success = true,

            buildingsAndRooms = new
            {
                ready = buildingsReady,
                buildingCount,
                roomCount
            },

            classes = new
            {
                ready = classesReady,
                count = classCount
            },

            subjects = new
            {
                ready = subjectsReady,
                count = subjectCount
            },

            teachers = new
            {
                ready = teachersReady,
                count = teacherCount
            },

            teacherAssignments = new
            {
                ready = teacherAssignmentsReady,
                count = teacherAssignmentCount,
                classesWithAssignments,
                classesWithoutAssignments
            },

            lessons = new
            {
                ready = lessonsReady,
                count = lessonCount,
                classesWithLessons,
                classesWithoutLessons
            },

            availability = new
            {
                ready = availabilityReady,
                customRuleCount = availabilityRuleCount,
                teacherRuleCount = teacherAvailabilityCount,
                classRuleCount = classAvailabilityCount,
                roomRuleCount = roomAvailabilityCount
            },

            optimization = new
            {
                ready = dataReadyForOptimization,
                runCount = optimizationRunCount
            },

            dataReadyForOptimization,
            nextStep
        });
    }
}
