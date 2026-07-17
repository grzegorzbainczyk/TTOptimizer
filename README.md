# ClassFlow

ClassFlow is a web application for preparing and optimizing school timetables.

The project combines a modern ASP.NET Core web application with a separate C++ optimization engine. Users can define teachers, classes, subjects, rooms, and lesson requirements, then generate a timetable and inspect the result in a browser.

A stable demonstration version is available at:

**https://classflow.blue**

## Project goals

I created ClassFlow as a personal development and portfolio project.

The main goals were to:

- build a complete application from database to deployment,
- learn and apply modern ASP.NET Core and C#,
- combine a web backend with a native C++ optimization engine,
- practise software architecture and integration between multiple technologies,
- develop an application that demonstrates backend, database, frontend, deployment, and algorithmic skills.

## Main features

The current application supports:

- demo access without registration,
- management of teachers,
- management of class groups,
- management of subjects,
- management of rooms,
- definition of weekly lesson requirements,
- generation of a timetable using a C++ optimization engine,
- presentation of the generated timetable in the browser,
- filtering the timetable by class, teacher, or room,
- organization-based data separation,
- validation of missing or incomplete input data.

The current server version contains one stable demonstration dataset.

The local development version also includes additional demo scenarios, organization-aware optimization, and further user-interface improvements.

## Technology stack

### Backend

- C#
- ASP.NET Core
- REST API
- Entity Framework Core
- asynchronous programming
- dependency injection
- PostgreSQL

### Optimization engine

- C++17
- chromosome-based timetable representation
- fitness evaluation
- mutation by swapping timetable assignments
- iterative local search

### Frontend

- HTML
- CSS
- JavaScript
- browser Fetch API
- responsive layout

### Deployment and development

- Git
- GitHub
- Visual Studio
- IIS
- Windows Server
- HTTPS
- DNS configuration
- JSON communication between ASP.NET Core and C++

## Architecture

The solution is divided into three main parts:

```text
Browser UI
    |
    | HTTP / JSON
    v
ASP.NET Core Web Application
    |
    | input.json / output.json
    | process execution
    v
C++ Optimization Engine
    |
    v
Generated timetable result
