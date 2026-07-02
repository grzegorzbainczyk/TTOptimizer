using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptimizationController : ControllerBase
{
    private readonly CppOptimizerService _optimizerService;
    private readonly TestProblemFactory _testProblemFactory;
    private readonly ScheduleSlotGeneratorService _scheduleSlotGenerator;
    private readonly LessonInstanceGeneratorService _lessonInstanceGenerator;
    private readonly TimetableDecoderService _timetableDecoder;

    public OptimizationController(
        CppOptimizerService optimizerService,
        TestProblemFactory testProblemFactory,
        ScheduleSlotGeneratorService scheduleSlotGenerator,
        LessonInstanceGeneratorService lessonInstanceGenerator,
        TimetableDecoderService timetableDecoder)
    {
        _optimizerService = optimizerService;
        _testProblemFactory = testProblemFactory;
        _scheduleSlotGenerator = scheduleSlotGenerator;
        _lessonInstanceGenerator = lessonInstanceGenerator;
        _timetableDecoder = timetableDecoder;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run()
    {
        var engineResult = await _optimizerService.RunOptimizationAsync();

        if (!engineResult.Success)
        {
            return Ok(new OptimizationViewResult
            {
                Success = false,
                InitialPenalty = engineResult.InitialPenalty,
                BestPenalty = engineResult.BestPenalty,
                Error = engineResult.Error
            });
        }

        var problem = _testProblemFactory.CreateTestProblem1();

        var scheduleSlots = _scheduleSlotGenerator.Generate(problem);
        var lessonInstances = _lessonInstanceGenerator.Generate(problem);

        var scheduledLessons = _timetableDecoder.Decode(
            engineResult,
            problem,
            scheduleSlots,
            lessonInstances);

        var viewResult = new OptimizationViewResult
        {
            Success = true,
            InitialPenalty = engineResult.InitialPenalty,
            BestPenalty = engineResult.BestPenalty,
            ScheduledLessons = scheduledLessons
        };

        return Ok(viewResult);
    }
}