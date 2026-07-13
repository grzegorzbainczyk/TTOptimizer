using Microsoft.AspNetCore.Mvc;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptimizationController : ControllerBase
{
    private readonly CppOptimizerService _cppOptimizerService;
    private readonly TimetableProblemBuilder _problemBuilder;
    private readonly ScheduleSlotGeneratorService _scheduleSlotGenerator;
    private readonly LessonInstanceGeneratorService _lessonInstanceGenerator;
    private readonly TimetableDecoderService _timetableDecoder;

    public OptimizationController(
        CppOptimizerService optimizerService,
        TimetableProblemBuilder problemBuilder,
        ScheduleSlotGeneratorService scheduleSlotGenerator,
        LessonInstanceGeneratorService lessonInstanceGenerator,
        TimetableDecoderService timetableDecoder)
    {
        _cppOptimizerService = optimizerService;
        _problemBuilder = problemBuilder;
        _scheduleSlotGenerator = scheduleSlotGenerator;
        _lessonInstanceGenerator = lessonInstanceGenerator;
        _timetableDecoder = timetableDecoder;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run()
    {
        int organizationId = 1; // demo na razie

        var buildResult = await _problemBuilder.BuildAsync(organizationId);

        if (!buildResult.Success || buildResult.Problem == null)
        {
            return BadRequest(new
            {
                success = false,
                message = buildResult.Message
            });
        }

        var problem = buildResult.Problem;

        // Na razie CppOptimizerService nie przyjmuje problemu,
        // tylko uruchamia silnik C++ z parametrem --json.
        var optimizationResult = await _cppOptimizerService.RunOptimizationAsync();

        return Ok(new
        {
            success = true,
            result = optimizationResult
        });
    }
}