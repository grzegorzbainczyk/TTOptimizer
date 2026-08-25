#pragma once
#include <map>
#include <utility>
#include <vector>
#include "Domain/TimetableModels.h"
using StudentGroupSubjectKey = std::pair<StudentGroupId, SubjectId>;
struct SubjectDayScheduleStats { int lessonCount{}; int adjacentPairCount{}; int unpairedLessonCount{}; };
struct SubjectClassScheduleStats { int lessonCount{}; int daysUsed{}; std::vector<SubjectDayScheduleStats> days; };
struct SubjectScheduleStats { std::map<StudentGroupSubjectKey, SubjectClassScheduleStats> byStudentGroupAndSubject; };
