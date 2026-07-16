using System.Diagnostics;
using System.Text.Json;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.Dto;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    private readonly string _enginePath;
    private readonly ILogger<CppOptimizerService> _logger;

    public CppOptimizerService(
    IConfiguration configuration,
    IWebHostEnvironment environment,
    ILogger<CppOptimizerService> logger)
    {
        _logger = logger;

        var configuredPath = configuration["CppEngine:Path"]
            ?? throw new InvalidOperationException(
                "CppEngine:Path is not configured.");

        _enginePath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(
                environment.ContentRootPath,
                configuredPath);
    }

    public async Task<EngineOutputDto> RunOptimizationAsync(TimetableProblem problem)
    {
        JsonSerializerOptions jso = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        OptimizerInputDto optimizerInputDto = CreateOptimizerInput(problem);

        var inputJson = JsonSerializer.Serialize(optimizerInputDto, jso);

        var inputPath = Path.Combine(
            Path.GetTempPath(),
            $"ttoptimizer_problem_{Guid.NewGuid():N}.json");

        var outputPath = Path.Combine(
            Path.GetTempPath(),
            $"ttoptimizer_result_{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(inputPath, inputJson);

        try
        {
            _logger.LogInformation(
    "Starting C++ optimizer. Engine: {EnginePath}, Input: {InputPath}, Output: {OutputPath}",
    _enginePath,
    inputPath,
    outputPath);

            if (!File.Exists(_enginePath))
            {
                throw new FileNotFoundException(
                    $"C++ optimizer executable was not found: {_enginePath}",
                    _enginePath);
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = _enginePath,
                Arguments = $"\"{inputPath}\" \"{outputPath}\"",
                WorkingDirectory = Path.GetDirectoryName(_enginePath) ?? throw new InvalidOperationException("Could not determine optimizer working directory."),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process
            {
                StartInfo = startInfo
            };

            process.Start();

            string stdout = await process.StandardOutput.ReadToEndAsync();
            string stderr = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"C++ engine failed with exit code {process.ExitCode}. Error: {stderr}. Output: {stdout}");
            }

            if (!File.Exists(outputPath))
            {
                throw new InvalidOperationException(
                    $"C++ engine did not create output file: {outputPath}. Error: {stderr}. Output: {stdout}");
            }

            string outputJson = await File.ReadAllTextAsync(outputPath);

            if (string.IsNullOrWhiteSpace(outputJson))
            {
                throw new InvalidOperationException(
                    $"C++ engine created empty output file: {outputPath}. Error: {stderr}. Output: {stdout}");
            }

            var result = JsonSerializer.Deserialize<EngineOutputDto>(outputJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (result is null)
            {
                throw new InvalidOperationException(
                    $"Could not deserialize C++ engine output. Output: {outputJson}");
            }

            return result;
        }
        finally
        {
            TryDeleteFile(inputPath);
            TryDeleteFile(outputPath);
        }
    }


    private OptimizerInputDto CreateOptimizerInput(TimetableProblem problem)
    {
        return new OptimizerInputDto
        {
            DaysPerWeek = problem.DaysPerWeek,
            SlotsPerDay = problem.SlotsPerDay,

            Teachers = problem.Teachers.Select(t => new OptimizerTeacherDto
            {
                Id = t.Id,
                Name = t.Name
            }).ToList(),

            Classes = problem.ClassGroups.Select(c => new OptimizerClassGroupDto
            {
                Id = c.Id,
                Name = c.Name
            }).ToList(),

            Subjects = problem.Subjects.Select(s => new OptimizerSubjectDto
            {
                Id = s.Id,
                Name = s.Name
            }).ToList(),

            Rooms = problem.Rooms.Select(r => new OptimizerRoomDto
            {
                Id = r.Id,
                Name = r.Name
            }).ToList(),

            LessonRequirements = problem.LessonRequirements.Select(req => new OptimizerLessonRequirementDto
            {
                Id = req.Id,
                TeacherId = req.TeacherId,
                ClassGroupId = req.ClassGroupId,
                SubjectId = req.SubjectId,
                LessonsPerWeek = req.HoursPerWeek
            }).ToList()
        };
    }

    private void TryDeleteFile(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not delete temporary optimizer file: {Path}",
                path);
        }
    }
}