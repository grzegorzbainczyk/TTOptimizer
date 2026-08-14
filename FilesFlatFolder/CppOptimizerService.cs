using System;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using TTOptimizer.Web.Models;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO;
using TTOptimizer.Web.Models.Optimization;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    private readonly string _enginePath;
    private readonly string _runsDirectory;
    private readonly ILogger<CppOptimizerService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public CppOptimizerService(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<CppOptimizerService> logger)
    {
        _logger = logger;

        var configuredPath = configuration["CppEngine:Path"]
            ?? throw new InvalidOperationException(
                "CppEngine:Path is not configured.");

        _enginePath = Path.GetFullPath(
            Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(
                    environment.ContentRootPath,
                    configuredPath));

        string? configuredRunsDirectory =
            configuration["CppEngine:RunsDirectory"];

        _runsDirectory = Path.GetFullPath(
            string.IsNullOrWhiteSpace(configuredRunsDirectory)
                ? Path.Combine(
                    environment.ContentRootPath,
                    "App_Data",
                    "OptimizationRuns")
                : Path.IsPathRooted(configuredRunsDirectory)
                    ? configuredRunsDirectory
                    : Path.Combine(
                        environment.ContentRootPath,
                        configuredRunsDirectory));
    }

    public async Task<EngineOutputDto> RunOptimizationAsync(
        TimetableProblem problem,
        Func<OptimizationProgressDto, CancellationToken, Task>? progressCallback = null,
        CancellationToken cancellationToken = default)
    {
        string runId = Guid.NewGuid().ToString("N");
        string runDirectory = Path.Combine(_runsDirectory, runId);

        string inputPath = Path.Combine(runDirectory, "input.json");
        string outputPath = Path.Combine(runDirectory, "output.json");
        string stdoutPath = Path.Combine(runDirectory, "stdout.log");
        string stderrPath = Path.Combine(runDirectory, "stderr.log");

        Directory.CreateDirectory(runDirectory);

        OptimizerInputDto optimizerInputDto =
            CreateOptimizerInput(problem);

        string inputJson = JsonSerializer.Serialize(
            optimizerInputDto,
            JsonOptions);

        await File.WriteAllTextAsync(
            inputPath,
            inputJson,
            cancellationToken);

        string workingDirectory =
            Path.GetDirectoryName(_enginePath)
            ?? throw new InvalidOperationException(
                "Could not determine optimizer working directory.");

        _logger.LogInformation(
            """
            Starting C++ optimizer.
            RunId: {RunId}
            EnginePath: {EnginePath}
            WorkingDirectory: {WorkingDirectory}
            InputPath: {InputPath}
            OutputPath: {OutputPath}
            RunDirectory: {RunDirectory}
            """,
            runId,
            _enginePath,
            workingDirectory,
            inputPath,
            outputPath,
            runDirectory);

        try
        {
            ValidateOptimizerFiles(
                runId,
                inputPath,
                workingDirectory);

            var startInfo = new ProcessStartInfo
            {
                FileName = _enginePath,
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            startInfo.ArgumentList.Add(inputPath);
            startInfo.ArgumentList.Add(outputPath);

            using var process = new Process
            {
                StartInfo = startInfo,
                EnableRaisingEvents = true
            };

            var stopwatch = Stopwatch.StartNew();

            bool processStarted;

            try
            {
                processStarted = process.Start();
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    """
                    Could not start C++ optimizer process.
                    RunId: {RunId}
                    EnginePath: {EnginePath}
                    WorkingDirectory: {WorkingDirectory}
                    """,
                    runId,
                    _enginePath,
                    workingDirectory);

                throw new InvalidOperationException(
                    $"Could not start C++ optimizer process. RunId: {runId}.",
                    exception);
            }

            if (!processStarted)
            {
                throw new InvalidOperationException(
                    $"Process.Start returned false. RunId: {runId}.");
            }

            _logger.LogInformation(
                "C++ optimizer process started. RunId: {RunId}, ProcessId: {ProcessId}",
                runId,
                process.Id);

            Task<string> stdoutTask = ReadStandardOutputAsync(
                process,
                progressCallback,
                cancellationToken);

            Task<string> stderrTask =
                process.StandardError.ReadToEndAsync(cancellationToken);

            string stdout;
            string stderr;

            try
            {
                await process.WaitForExitAsync(cancellationToken);

                stdout = await stdoutTask;
                stderr = await stderrTask;
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                TryKillProcess(process, runId);

                try
                {
                    await process.WaitForExitAsync(
                        CancellationToken.None);
                }
                catch (Exception exception)
                {
                    _logger.LogDebug(
                        exception,
                        "The C++ optimizer process was already stopped. RunId: {RunId}",
                        runId);
                }

                throw;
            }
            finally
            {
                stopwatch.Stop();
            }

            await File.WriteAllTextAsync(
                stdoutPath,
                stdout,
                CancellationToken.None);

            await File.WriteAllTextAsync(
                stderrPath,
                stderr,
                CancellationToken.None);

            _logger.LogInformation(
                """
                C++ optimizer process finished.
                RunId: {RunId}
                ProcessId: {ProcessId}
                ExitCode: {ExitCode}
                DurationMs: {DurationMs}
                OutputFileExists: {OutputFileExists}
                StdoutPath: {StdoutPath}
                StderrPath: {StderrPath}
                """,
                runId,
                process.Id,
                process.ExitCode,
                stopwatch.ElapsedMilliseconds,
                File.Exists(outputPath),
                stdoutPath,
                stderrPath);

            if (!string.IsNullOrWhiteSpace(stdout))
            {
                _logger.LogInformation(
                    "C++ optimizer stdout. RunId: {RunId}{NewLine}{Stdout}",
                    runId,
                    Environment.NewLine,
                    stdout);
            }

            if (!string.IsNullOrWhiteSpace(stderr))
            {
                _logger.LogWarning(
                    "C++ optimizer stderr. RunId: {RunId}{NewLine}{Stderr}",
                    runId,
                    Environment.NewLine,
                    stderr);
            }

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"C++ engine failed with exit code {process.ExitCode}. " +
                    $"RunId: {runId}. " +
                    $"See diagnostic files in: {runDirectory}");
            }

            if (!File.Exists(outputPath))
            {
                throw new InvalidOperationException(
                    $"C++ engine did not create output file. " +
                    $"RunId: {runId}. Expected file: {outputPath}. " +
                    $"See diagnostic files in: {runDirectory}");
            }

            string outputJson = await File.ReadAllTextAsync(
                outputPath,
                cancellationToken);

            if (string.IsNullOrWhiteSpace(outputJson))
            {
                throw new InvalidOperationException(
                    $"C++ engine created an empty output file. " +
                    $"RunId: {runId}. Output file: {outputPath}. " +
                    $"See diagnostic files in: {runDirectory}");
            }

            EngineOutputDto? result;

            try
            {
                result = JsonSerializer.Deserialize<EngineOutputDto>(
                    outputJson,
                    JsonOptions);
            }
            catch (JsonException exception)
            {
                _logger.LogError(
                    exception,
                    """
                    Could not deserialize C++ engine output.
                    RunId: {RunId}
                    OutputPath: {OutputPath}
                    OutputJson: {OutputJson}
                    """,
                    runId,
                    outputPath,
                    outputJson);

                throw new InvalidOperationException(
                    $"Could not deserialize C++ engine output. " +
                    $"RunId: {runId}. Output file: {outputPath}.",
                    exception);
            }

            if (result is null)
            {
                throw new InvalidOperationException(
                    $"C++ engine output deserialized to null. " +
                    $"RunId: {runId}. Output file: {outputPath}.");
            }

            _logger.LogInformation(
                "C++ optimizer result successfully read. RunId: {RunId}",
                runId);

            return result;
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                """
                C++ optimization was cancelled.
                RunId: {RunId}
                RunDirectory: {RunDirectory}
                """,
                runId,
                runDirectory);

            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                """
                C++ optimization failed.
                RunId: {RunId}
                EnginePath: {EnginePath}
                InputPath: {InputPath}
                OutputPath: {OutputPath}
                RunDirectory: {RunDirectory}
                """,
                runId,
                _enginePath,
                inputPath,
                outputPath,
                runDirectory);

            throw;
        }
    }

    private void ValidateOptimizerFiles(
        string runId,
        string inputPath,
        string workingDirectory)
    {
        if (!File.Exists(_enginePath))
        {
            throw new FileNotFoundException(
                $"C++ optimizer executable was not found. " +
                $"RunId: {runId}. Path: {_enginePath}",
                _enginePath);
        }

        if (!Directory.Exists(workingDirectory))
        {
            throw new DirectoryNotFoundException(
                $"C++ optimizer working directory was not found. " +
                $"RunId: {runId}. Path: {workingDirectory}");
        }

        if (!File.Exists(inputPath))
        {
            throw new FileNotFoundException(
                $"C++ optimizer input file was not found. " +
                $"RunId: {runId}. Path: {inputPath}",
                inputPath);
        }
    }

    private async Task<string> ReadStandardOutputAsync(
        Process process,
        Func<OptimizationProgressDto, CancellationToken, Task>? progressCallback,
        CancellationToken cancellationToken)
    {
        var completeOutput = new StringBuilder();

        while (true)
        {
            string? line =
                await process.StandardOutput.ReadLineAsync(
                    cancellationToken);

            if (line is null)
            {
                break;
            }

            completeOutput.AppendLine(line);

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            await TryReportProgressAsync(
                line,
                progressCallback,
                cancellationToken);
        }

        return completeOutput.ToString();
    }

    private async Task TryReportProgressAsync(
        string line,
        Func<OptimizationProgressDto, CancellationToken, Task>? progressCallback,
        CancellationToken cancellationToken)
    {
        if (progressCallback is null)
        {
            return;
        }

        try
        {
            OptimizationProgressDto? message =
                JsonSerializer.Deserialize<OptimizationProgressDto>(
                    line,
                    JsonOptions);

            if (message is null ||
                !string.Equals(
                    message.Type,
                    "progress",
                    StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            await progressCallback(
                message,
                cancellationToken);
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(
                exception,
                "Could not parse C++ optimizer stdout line as progress JSON: {Line}",
                line);
        }
    }

    private OptimizerInputDto CreateOptimizerInput(
        TimetableProblem problem)
    {
        return new OptimizerInputDto
        {
            DaysPerWeek = problem.DaysPerWeek,
            SlotsPerDay = problem.SlotsPerDay,

            Teachers = problem.Teachers
                .Select(teacher =>
                    new OptimizerTeacherDto
                    {
                        Id = teacher.Id,
                        Name = teacher.Name
                    })
                .ToList(),

            Classes = problem.ClassGroups
                .Select(classGroup =>
                    new OptimizerClassGroupDto
                    {
                        Id = classGroup.Id,
                        Name = classGroup.Name
                    })
                .ToList(),

            Subjects = problem.Subjects
                .Select(subject =>
                    new OptimizerSubjectDto
                    {
                        Id = subject.Id,
                        Name = subject.Name
                    })
                .ToList(),

            Rooms = problem.Rooms
                .Select(room =>
                    new OptimizerRoomDto
                    {
                        Id = room.Id,
                        Name = room.Name,
                        BuildingId = room.BuildingId
                    })
                .ToList(),

            StudentGroups = problem.StudentGroups
                .Select(group => new OptimizerStudentGroupDto
                {
                    Id = group.Id,
                    Name = group.Name,
                    Type = group.Type.ToString(),
                    ClassGroupIds = group.ClassGroupIds
                })
                .ToList(),

            StudentGroupConflicts = problem.StudentGroupConflicts
                .Select(conflict => new OptimizerStudentGroupConflictDto
                {
                    FirstStudentGroupId = conflict.FirstStudentGroupId,
                    SecondStudentGroupId = conflict.SecondStudentGroupId
                })
                .ToList(),

            StudentGroupAvoidImmediateBuildingChange =
                problem.StudentGroupAvoidImmediateBuildingChange.ToString(),

            LessonRequirements =
                problem.LessonRequirements
                    .Select(requirement =>
                        new OptimizerLessonRequirementDto
                        {
                            Id = requirement.Id,
                            TeacherId = requirement.TeacherId,
                            ClassGroupId = requirement.ClassGroupId ?? 0,
                            StudentGroupId = requirement.StudentGroupId ?? 0,
                            SubjectId = requirement.SubjectId,
                            LessonsPerWeek = requirement.HoursPerWeek
                        })
                    .ToList(),

            TeacherTimeSlotPreferences =
                problem.TeacherTimeSlotPreferences,

            ClassGroupTimeSlotPreferences =
                problem.ClassGroupTimeSlotPreferences,

            RoomTimeSlotPreferences =
                problem.RoomTimeSlotPreferences,

            SubjectTimeSlotPreferences =
                problem.SubjectTimeSlotPreferences,

            TeacherSchedulingPreferences =
                problem.TeacherSchedulingPreferences,

            ClassGroupSchedulingPreferences =
                problem.ClassGroupSchedulingPreferences,

            SubjectSchedulingPreferences =
                problem.SubjectSchedulingPreferences,

            OptimizationSettings =
                problem.OptimizationSettings
        };
    }

    private void TryKillProcess(
        Process process,
        string runId)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);

                _logger.LogWarning(
                    "C++ optimizer process was killed. RunId: {RunId}, ProcessId: {ProcessId}",
                    runId,
                    process.Id);
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not stop the C++ optimizer process. RunId: {RunId}",
                runId);
        }
    }
}