cmake_minimum_required(VERSION 3.20)

project(TimetableGA VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(TimetableGA
    src/main.cpp
    src/ChromosomeFactory.cpp
    src/FitnessEvaluator.cpp
)

target_include_directories(TimetableGA PRIVATE include)
