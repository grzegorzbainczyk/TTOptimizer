#include <string>
#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include "TimetableProblemJsonReader.h"
#include "Engine.h"

#ifdef _DEBUG
#include <Windows.h>
#endif

int main(int argc, char* argv[])
{
#ifdef _DEBUG
    /*while (!IsDebuggerPresent())
    {
        Sleep(200);
    }

    DebugBreak();*/
#endif

    if (argc < 3)
    {
        std::cerr
            << "Usage: TTOptimizer.Console.exe "
            << "<input_json_path> <output_json_path>"
            << std::endl;

        return 1;
    }

    const std::string inputPath = argv[1];
    const std::string outputPath = argv[2];

    try
    {
        TimetableProblemJsonReader reader;
        TimetableProblem problem = reader.readFromFile(inputPath);

        std::string outputJson;

        Engine engine;
        engine.optimize(problem, outputJson);

        if (outputJson.empty())
        {
            std::cerr << "Optimizer returned empty output." << std::endl;
            return 2;
        }

        std::ofstream outputFile(outputPath);

        if (!outputFile)
        {
            std::cerr
                << "Could not open output file: "
                << outputPath
                << std::endl;

            return 3;
        }

        outputFile << outputJson;

        if (!outputFile)
        {
            std::cerr
                << "Could not write output file: "
                << outputPath
                << std::endl;

            return 4;
        }

        std::cout
            << "Optimization completed successfully."
            << std::endl;

        return 0;
    }
    catch (const std::exception& exception)
    {
        std::cerr
            << "Optimizer error: "
            << exception.what()
            << std::endl;

        return 5;
    }
    catch (...)
    {
        std::cerr
            << "Optimizer failed with an unknown error."
            << std::endl;

        return 6;
    }
}

