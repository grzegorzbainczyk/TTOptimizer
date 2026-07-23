using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Dto;
using TTOptimizer.Web.Models.Optimization;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptimizationController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    private readonly CppOptimizerService _cppOptimizerService;
    private readonly TimetableProblemBuilder _timetableProblemBuilder;
    private readonly ScheduleSlotGeneratorService _scheduleSlotGenerator;
    private readonly LessonInstanceGeneratorService _lessonInstanceGenerator;
    private readonly TimetableDecoderService _timetableDecoder;

    public OptimizationController(
        AppDbContext dbContext,
        CppOptimizerService cppOptimizerService,
        TimetableProblemBuilder timetableProblemBuilder,
        ScheduleSlotGeneratorService scheduleSlotGenerator,
        LessonInstanceGeneratorService lessonInstanceGenerator,
        TimetableDecoderService timetableDecoder)
    {
        _dbContext = dbContext;
        _timetableProblemBuilder = timetableProblemBuilder;
        _cppOptimizerService = cppOptimizerService;

        _timetableProblemBuilder = timetableProblemBuilder;
        _scheduleSlotGenerator = scheduleSlotGenerator;
        _lessonInstanceGenerator = lessonInstanceGenerator;
        _timetableDecoder = timetableDecoder;
    }

    
    [HttpPost("run")]
    public async Task<IActionResult> Run(
    [FromQuery] int organizationId,
    [FromQuery] int optimizationLevel)
    {
        var iterations = optimizationLevel switch
        {
            1 => 10_000,
            2 => 100_000,
            3 => 500_000,
            _ => 100_000
        };

        if (optimizationLevel is < 1 or > 3)
        {
            return BadRequest(new
            {
                success = false,
                message = "Optimization level must be between 1 and 3."
            });
        }

        var optimizationSettings = new OptimizationSettings
        {
            Iterations = optimizationLevel switch
            {
                1 => 10_000,
                2 => 100_000,
                3 => 500_000
            },
            RandomSeed = 12345
        };

        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organizationExists =
            await _dbContext.Organizations.AnyAsync(
                organization => organization.Id == organizationId
            );

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var buildResult = await _timetableProblemBuilder.BuildAsync(organizationId, optimizationSettings);

        if (!buildResult.Success || buildResult.Problem == null)
        {
            return BadRequest(new
            {
                success = false,
                message = buildResult.Message
            });
        }

        var problem = buildResult.Problem;

        var engineResult = await _cppOptimizerService.RunOptimizationAsync(problem);

        var classGroupsById = problem.ClassGroups.ToDictionary(x => x.Id);
        var subjectsById = problem.Subjects.ToDictionary(x => x.Id);
        var teachersById = problem.Teachers.ToDictionary(x => x.Id);
        var roomsById = problem.Rooms.ToDictionary(x => x.Id);

        var scheduledLessonViews = engineResult.ScheduledLessons
     .Select(x => new ScheduledLessonViewDto
     {
         LessonInstanceId = x.LessonInstanceId,
         RequirementId = x.RequirementId,

         ClassGroup = classGroupsById.TryGetValue(x.ClassGroupId, out var classGroup)
             ? classGroup.Name
             : $"Class #{x.ClassGroupId}",

         Subject = subjectsById.TryGetValue(x.SubjectId, out var subject)
             ? subject.Name
             : $"Subject #{x.SubjectId}",

         Teacher = teachersById.TryGetValue(x.TeacherId, out var teacher)
             ? teacher.Name
             : $"Teacher #{x.TeacherId}",

         Room = roomsById.TryGetValue(x.RoomId, out var room)
             ? room.Name
             : $"Room #{x.RoomId}",

         Day = x.Day,
         LessonNumber = x.LessonNumber
     })
     .ToList();

        return Ok(new
        {
            success = true,
            result = new
            {
                feedback = engineResult.OptimizationInfo.Message,
                success = engineResult.Success,
                initialPenalty = engineResult.InitialPenalty,
                bestPenalty = engineResult.BestPenalty,
                scheduledLessons = scheduledLessonViews,
                error = engineResult.Error
            }
        });
    }
}