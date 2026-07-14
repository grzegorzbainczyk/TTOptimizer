using System.Diagnostics;
using System.Text.Json;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.Dto;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    private readonly string _enginePath;

    public CppOptimizerService(IConfiguration configuration)
    {
        _enginePath = configuration["CppEngine:Path"]
            ?? throw new InvalidOperationException("CppEngine:Path is not configured.");
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
            var startInfo = new ProcessStartInfo
            {
                FileName = _enginePath,
                //Arguments = $"--input \"{inputPath}\" --output \"{outputPath}\"",
                Arguments = $"\"{inputPath}\" \"{outputPath}\"",
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

            var result = JsonSerializer.Deserialize<EngineOutputDto>( outputJson, new JsonSerializerOptions {PropertyNameCaseInsensitive = true});

            if (result is null)
            {
                throw new InvalidOperationException(
                    $"Could not deserialize C++ engine output. Output: {outputJson}");
            }

            return result;
        }
        finally
        {
            if (File.Exists(inputPath))
            {
                // Na razie zostawiamy do debugowania.
                // File.Delete(inputPath);
            }

            if (File.Exists(outputPath))
            {
                // Na razie zostawiamy do debugowania.
                // File.Delete(outputPath);
            }
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
}