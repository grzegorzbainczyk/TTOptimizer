// TTOptimizer.Engine.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <string>

int main(int argc, char* argv[])
{
    if (argc < 2)
    {
        std::cerr << "Error: missing input argument\n";
        return 1;
    }

    std::string input = argv[1];

    std::cout << "C++ received: " << input << std::endl;

    return 0;
}
