using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models;
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
    public async Task<IActionResult> Run()
    {
        var organization = await _dbContext.Organizations.FirstOrDefaultAsync(o => o.Name == "Demo School");

        if (organization == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Demo organization was not found."
            });
        }

        var organizationId = organization.Id;

        var buildResult = await _timetableProblemBuilder.BuildAsync(organizationId);

        if (!buildResult.Success || buildResult.Problem == null)
        {
            return BadRequest(new
            {
                success = false,
                message = buildResult.Message
            });
        }

        var problem = buildResult.Problem;

        var resultJson = await _cppOptimizerService.RunOptimizationAsync(problem);

        return Ok(new
        {
            success = true,
            result = resultJson.RootElement
        });
    }
}