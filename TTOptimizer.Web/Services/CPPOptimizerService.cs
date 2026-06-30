using System.Diagnostics;
using TTOptimizer.Web.Models;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    public async Task<OptimizationResponse> RunOptimizerAsync(string input)
    {
        var exePath = @"C:\TTOptimizer\x64\Debug\TTOptimizer.Engine.exe";

        var startInfo = new ProcessStartInfo
        {
            FileName = exePath,
            Arguments = $"\"{input}\"",
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

        return new OptimizationResponse
        {
            Success = process.ExitCode == 0,
            Output = output,
            Error = error
        };
    }
}