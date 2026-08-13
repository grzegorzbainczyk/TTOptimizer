#pragma once
#include <algorithm>
#include <unordered_map>
#include <vector>
#include "Domain/TimetableProblem.h"
#include "Evaluation/Rules/ClassGroupScheduleStats.h"

class ClassGroupScheduleStatsBuilder
{
public:
    static ClassGroupScheduleStats build(const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        ClassGroupScheduleStats result;
        std::unordered_map<ClassGroupId, std::vector<std::vector<bool>>> occupancy;
        for (const ClassGroup& c : problem.classGroups)
            occupancy.emplace(c.id, std::vector<std::vector<bool>>(problem.daysPerWeek,
                std::vector<bool>(problem.slotsPerDay, false)));

        std::unordered_map<StudentGroupId, std::vector<ClassGroupId>> classIdsByStudentGroup;
        for (const StudentGroup& g : problem.studentGroups) classIdsByStudentGroup.emplace(g.id, g.classGroupIds);
        std::unordered_map<LessonRequirementId, StudentGroupId> groupByRequirement;
        for (const LessonRequirement& r : problem.lessonRequirements) groupByRequirement.emplace(r.id, r.studentGroupId);

        for (LessonInstanceIndex i=0; i<chromosome.genes.size() && i<lessonInstances.size(); ++i)
        {
            const auto slotIndex=chromosome.genes[i]; if(slotIndex>=scheduleSlots.size()) continue;
            const auto rg=groupByRequirement.find(lessonInstances[i].requirementId); if(rg==groupByRequirement.end()) continue;
            const auto classes=classIdsByStudentGroup.find(rg->second); if(classes==classIdsByStudentGroup.end()) continue;
            const auto& slot=scheduleSlots[slotIndex]; const int d=static_cast<int>(slot.timeSlot.day); const int s=slot.timeSlot.lessonNumber;
            if(d<0||d>=problem.daysPerWeek||s<0||s>=problem.slotsPerDay) continue;
            for(ClassGroupId classId: classes->second) { auto it=occupancy.find(classId); if(it!=occupancy.end()) it->second[d][s]=true; }
        }

        for(auto& [classId,days]:occupancy)
        {
            std::vector<ClassGroupDayScheduleStats> statsDays(problem.daysPerWeek);
            for(int d=0;d<problem.daysPerWeek;++d)
            {
                ClassGroupDayScheduleStats stats; int consecutive=0;
                for(int s=0;s<problem.slotsPerDay;++s)
                {
                    if(!days[d][s]){consecutive=0;continue;}
                    ++stats.lessonCount; if(stats.firstSlot<0) stats.firstSlot=s; stats.lastSlot=s;
                    ++consecutive; stats.maxConsecutiveLessons=std::max(stats.maxConsecutiveLessons,consecutive);
                }
                statsDays[d]=stats;
            }
            result.byClassGroup.emplace(classId,std::move(statsDays));
        }
        return result;
    }
};
