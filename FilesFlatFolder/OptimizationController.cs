using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Hubs;
using TTOptimizer.Web.Models.DTO;
using TTOptimizer.Web.Models.Optimization;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptimizationController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CppOptimizerService _cppOptimizerService;
    private readonly TimetableProblemBuilderService _timetableProblemBuilder;
    private readonly IHubContext<OptimizationHub> _optimizationHub;

    public OptimizationController(
        AppDbContext dbContext,
        CppOptimizerService cppOptimizerService,
        TimetableProblemBuilderService timetableProblemBuilder,
        IHubContext<OptimizationHub> optimizationHub)
    {
        _dbContext = dbContext;
        _cppOptimizerService = cppOptimizerService;
        _timetableProblemBuilder = timetableProblemBuilder;
        _optimizationHub = optimizationHub;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run(
        [FromQuery] int organizationId,
        [FromQuery] string connectionId,
        [FromBody] OptimizationSettings optimizationSettings,
        CancellationToken cancellationToken)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        if (string.IsNullOrWhiteSpace(connectionId))
        {
            return BadRequest(new
            {
                success = false,
                message = "SignalR connection ID is required."
            });
        }

        bool organizationExists =
            await _dbContext.Organizations.AnyAsync(
                organization => organization.Id == organizationId,
                cancellationToken);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var buildResult =
            await _timetableProblemBuilder.BuildAsync(
                organizationId,
                optimizationSettings);

        if (!buildResult.Success || buildResult.Problem == null)
        {
            return BadRequest(new
            {
                success = false,
                message = buildResult.Message
            });
        }

        var problem = buildResult.Problem;

        Task ReportProgressAsync(
            OptimizationProgressDto progress,
            CancellationToken token)
        {
            return _optimizationHub.Clients
                .Client(connectionId)
                .SendAsync(
                    "OptimizationProgress",
                    progress,
                    token);
        }

        EngineOutputDto engineResult;

        try
        {
            engineResult =
                await _cppOptimizerService.RunOptimizationAsync(
                    problem,
                    ReportProgressAsync,
                    cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            return StatusCode(499, new
            {
                success = false,
                cancelled = true,
                message = "Optimization was stopped by the user."
            });
        }

        var classGroupsById =
            problem.ClassGroups.ToDictionary(x => x.Id);

        var subjectsById =
            problem.Subjects.ToDictionary(x => x.Id);

        var teachersById =
            problem.Teachers.ToDictionary(x => x.Id);

        var roomsById =
            problem.Rooms.ToDictionary(x => x.Id);

        var scheduledLessonViews = engineResult.ScheduledLessons
            .Select(x => new ScheduledLessonViewDto
            {
                LessonInstanceId = x.LessonInstanceId,
                RequirementId = x.RequirementId,
                ClassGroup =
                    classGroupsById.TryGetValue(
                        x.ClassGroupId,
                        out var classGroup)
                        ? classGroup.Name
                        : $"Class #{x.ClassGroupId}",
                Subject =
                    subjectsById.TryGetValue(
                        x.SubjectId,
                        out var subject)
                        ? subject.Name
                        : $"Subject #{x.SubjectId}",
                Teacher =
                    teachersById.TryGetValue(
                        x.TeacherId,
                        out var teacher)
                        ? teacher.Name
                        : $"Teacher #{x.TeacherId}",
                Room =
                    roomsById.TryGetValue(
                        x.RoomId,
                        out var room)
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
                success = engineResult.Success,
                canOptimize = engineResult.CanOptimize,
                message = engineResult.Message,
                feedback = engineResult.OptimizationInfo.Message,
                initialPenalty = engineResult.InitialPenalty,
                bestPenalty = engineResult.BestPenalty,
                hardViolationCount = engineResult.HardViolationCount,
                preprocessingIssues = engineResult.PreprocessingIssues,
                scheduledLessons = scheduledLessonViews,
                optimizationInfo = engineResult.OptimizationInfo,
                error = engineResult.Error
            }
        });
    }
}
