# TimetableGA

Minimal C++20 skeleton for a school timetable generator using a genetic-algorithm-friendly domain model.

## Build in Visual Studio 2022

Recommended option: open the folder directly in Visual Studio.

1. Open Visual Studio 2022.
2. Choose **File -> Open -> Folder...**.
3. Select the `TimetableGA` folder.
4. Visual Studio should detect `CMakeLists.txt` automatically.
5. Choose target `TimetableGA.exe`.
6. Run with **Ctrl+F5**.

## Build from command line

```powershell
cmake -S . -B build
cmake --build build
.\build\Debug\TimetableGA.exe
```

Depending on your generator/configuration, the exe path may differ.

## Files

- `include/Domain.h` - core domain model: teachers, classes, subjects, rooms, requirements, chromosome.
- `include/ChromosomeFactory.h` and `src/ChromosomeFactory.cpp` - random chromosome generation.
- `include/FitnessEvaluator.h` and `src/FitnessEvaluator.cpp` - first hard-constraint fitness evaluator.
- `include/Utils.h` - helper lookup and conversion functions.
- `src/main.cpp` - sample problem and demo run.
