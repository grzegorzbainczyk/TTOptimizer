using System.Diagnostics;
using System.Text.Json;
using TTOptimizer.Web.Models;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    public async Task<OptimizationResponse> RunOptimizerAsync(OptimizationRequest request)
    {
        var exePath = @"C:\TTOptimizer\x64\Debug\TTOptimizer.Engine.exe";

        if (!File.Exists(exePath))
        {
            return new OptimizationResponse
            {
                Success = false,
                ErrorJson = $"C++ executable not found: {exePath}"
            };
        }

        var inputFilePath = Path.Combine(
            Path.GetTempPath(),
            $"ttoptimizer-input-{Guid.NewGuid():N}.json"
        );

        try
        {
            var jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var inputJson = JsonSerializer.Serialize(request, jsonOptions);

            await File.WriteAllTextAsync(inputFilePath, inputJson);

            var startInfo = new ProcessStartInfo
            {
                FileName = exePath,
                Arguments = $"\"{inputFilePath}\"",
                WorkingDirectory = Path.GetDirectoryName(exePath)!,
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

            string outputJson = await process.StandardOutput.ReadToEndAsync();
            string errorJson = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            return new OptimizationResponse
            {
                Success = process.ExitCode == 0,
                OutputJson = outputJson,
                ErrorJson = errorJson
            };
        }
        finally
        {
            if (File.Exists(inputFilePath))
            {
                File.Delete(inputFilePath);
            }
        }
    }
}