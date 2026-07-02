using System.Diagnostics;
using System.Text.Json;
using TTOptimizer.Web.Models;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    private readonly string _enginePath;

    public CppOptimizerService(IConfiguration configuration)
    {
        _enginePath = configuration["CppEngine:Path"]
            ?? throw new InvalidOperationException("CppEngine:Path is not configured.");
    }

    public async Task<EngineOptimizationResult> RunOptimizationAsync()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _enginePath,
            Arguments = "--json",
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

        string output = await process.StandardOutput.ReadToEndAsync();
        string error = await process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();

        if (string.IsNullOrWhiteSpace(output))
        {
            throw new InvalidOperationException(
                $"C++ engine returned empty output. Error: {error}");
        }

        var result = JsonSerializer.Deserialize<EngineOptimizationResult>(
            output,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

        if (result is null)
        {
            throw new InvalidOperationException(
                $"Could not deserialize C++ engine output. Output: {output}");
        }

        if (process.ExitCode != 0 && result.Success)
        {
            throw new InvalidOperationException(
                $"C++ engine failed with exit code {process.ExitCode}. Error: {error}");
        }

        return result;
    }
}