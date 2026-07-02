using System.Diagnostics;

namespace TTOptimizer.Web.Services;

public class CppOptimizerService
{
    private readonly string _enginePath;

    public CppOptimizerService(IConfiguration configuration)
    {
        _enginePath = configuration["CppEngine:Path"]
            ?? throw new InvalidOperationException("CppEngine:Path is not configured.");
    }

    public async Task<string> RunOptimizationAsync()
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

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"C++ engine failed with exit code {process.ExitCode}. Error: {error}. Output: {output}");
        }

        return output;
    }
}