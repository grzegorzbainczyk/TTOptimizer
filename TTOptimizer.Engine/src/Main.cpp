#include <string>
#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include "TimetableProblemJsonReader.h"
#include "Engine.h"


int main(int argc, char* argv[])
{
	std::string inputPath, outputPath;

	inputPath = argv[1];
	std::string inputJson;
	outputPath = argv[2];
	std::string outputJson;

	if (!inputPath.empty())
	{
		std::ifstream file(inputPath);

		if (!file)
		{
			std::cerr << "Could not open input file: " << inputPath << std::endl;
			return 1;
		}

		std::ostringstream buffer;
		buffer << file.rdbuf();
		inputJson = buffer.str();
	}

	TimetableProblemJsonReader reader;
	TimetableProblem problem = reader.readFromFile(inputPath);

	std::string result;

	Engine engine;
	engine.optimize(problem, outputJson);

	if (!outputPath.empty())
	{
		std::ofstream file(outputPath);

		if (!file)
		{
			std::cerr << "Could not open output file: " << outputPath << std::endl;
			return 1;
		}

		file << outputJson;
	}
	else
	{
		std::cout << outputJson << std::endl;
	}
	
	return 0;
}


