#include <algorithm>
#include <map>
#include <iterator>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>
#include <set>

#include "Evaluation/FitnessEvaluator.h"
#include "Evaluation/Rules/ConstraintRuleContext.h"
#include "Evaluation/Rules/TeacherScheduleStatsBuilder.h"
#include "Evaluation/Rules/ClassGroupScheduleStatsBuilder.h"
#include "Evaluation/Rules/SubjectScheduleStatsBuilder.h"

namespace
{
    using TimeKey = std::pair<int, int>;
    using TeacherTimeKey = std::pair<TeacherId, TimeKey>;
    using StudentGroupTimeKey = std::pair<StudentGroupId, TimeKey>;

    const LessonRequirement& FindRequirementById(
        const TimetableProblem& problem,
        LessonRequirementId requirementId)
    {
        const auto iterator = std::find_if(
            problem.lessonRequirements.begin(),
            problem.lessonRequirements.end(),
            [requirementId](
                const LessonRequirement& requirement)
            {
                return requirement.id == requirementId;
            });

        if (iterator ==
            problem.lessonRequirements.end())
        {
            throw std::runtime_error("Lesson requirement not found.");
        }

        return *iterator;
    }

    const Room& FindRoomById(
        const TimetableProblem& problem,
        RoomId roomId)
    {
        const auto iterator = std::find_if(
            problem.rooms.begin(),
            problem.rooms.end(),
            [roomId](const Room& room)
            {
                return room.id == roomId;
            });

        if (iterator == problem.rooms.end())
        {
            throw std::runtime_error("Room not found.");
        }

        return *iterator;
    }

    template <typename Preference, typename ResourceId>
    TimeSlotPreferenceType FindTimeSlotPreference(
        const std::vector<Preference>& preferences,
        ResourceId resourceId,
        int dayIndex,
        int slotIndex,
        ResourceId Preference::* idMember)
    {
        const auto iterator = std::find_if(
            preferences.begin(),
            preferences.end(),
            [resourceId, dayIndex, slotIndex, idMember](
                const Preference& preference)
            {
                return preference.*idMember == resourceId
                    && preference.dayIndex == dayIndex && preference.slotIndex == slotIndex;
            });

        if (iterator == preferences.end())
        {
            return TimeSlotPreferenceType::Available;
        }

        return iterator->preferenceType;
    }


    double LessonPriorityMultiplier(
        LessonPriority priority)
    {
        switch (priority)
        {
        case LessonPriority::Low:
            return 0.5;

        case LessonPriority::Normal:
            return 1.0;

        case LessonPriority::High:
            return 2.0;
        }

        return 1.0;
    }

    void AddTimeSlotPreferencePenalty(
        FitnessScore& score,
        TimeSlotPreferenceType preferenceType,
        LessonPriority priority)
    {
        const double multiplier =
            LessonPriorityMultiplier(priority);

        switch (preferenceType)
        {
        case TimeSlotPreferenceType::Preferred: return;

        case TimeSlotPreferenceType::Available:
            score.addSoftPenalty(1.0 * multiplier);
            return;

        case TimeSlotPreferenceType::NotPreferred:
            score.addSoftPenalty(10.0 * multiplier);
            return;

        case TimeSlotPreferenceType::Unavailable:
            // Hard violations are reported separately.
            return;
        }
    }

    const StudentGroup& FindStudentGroupById(
        const TimetableProblem& problem,
        StudentGroupId studentGroupId)
    {
        const auto iterator = std::find_if(
            problem.studentGroups.begin(), problem.studentGroups.end(),
            [studentGroupId](const StudentGroup& group) { return group.id == studentGroupId; });
        if (iterator == problem.studentGroups.end())
            throw std::runtime_error("Student group not found.");
        return *iterator;
    }

    bool StudentGroupsConflict(const TimetableProblem& problem,
        StudentGroupId first, StudentGroupId second)
    {
        if (first == second) return true;
        if (first > second) std::swap(first, second);
        return std::any_of(problem.studentGroupConflicts.begin(), problem.studentGroupConflicts.end(),
            [first, second](const StudentGroupConflict& conflict)
            {
                return conflict.firstStudentGroupId == first && conflict.secondStudentGroupId == second;
            });
    }

    int PreferenceRank(TimeSlotPreferenceType value)
    {
        switch (value)
        {
        case TimeSlotPreferenceType::Preferred: return 0;
        case TimeSlotPreferenceType::Available: return 1;
        case TimeSlotPreferenceType::NotPreferred: return 2;
        case TimeSlotPreferenceType::Unavailable: return 3;
        }
        return 1;
    }

    TimeSlotPreferenceType FindStudentGroupClassPreference(
        const TimetableProblem& problem,
        StudentGroupId studentGroupId,
        int dayIndex,
        int slotIndex)
    {
        const StudentGroup& group = FindStudentGroupById(problem, studentGroupId);
        TimeSlotPreferenceType result = TimeSlotPreferenceType::Preferred;
        for (ClassGroupId classGroupId : group.classGroupIds)
        {
            const auto current = FindTimeSlotPreference(problem.classGroupTimeSlotPreferences,
                classGroupId, dayIndex, slotIndex, &ClassGroupTimeSlotPreference::classGroupId);
            if (PreferenceRank(current) > PreferenceRank(result)) result = current;
        }
        return group.classGroupIds.empty() ? TimeSlotPreferenceType::Available : result;
    }


    void AddAdditionalLessonPlacementPenalty(
        FitnessScore& score,
        const Chromosome& chromosome,
        const TimetableProblem& problem,
        const std::vector<LessonInstance>& lessonInstances,
        const std::vector<ScheduleSlot>& scheduleSlots)
    {
        std::map<StudentGroupId, std::vector<StudentGroupId>>
            affectedStudentGroups;

        for (const auto& group : problem.studentGroups)
        {
            affectedStudentGroups[group.id].push_back(group.id);
        }

        for (const auto& conflict : problem.studentGroupConflicts)
        {
            affectedStudentGroups[conflict.firstStudentGroupId]
                .push_back(conflict.secondStudentGroupId);

            affectedStudentGroups[conflict.secondStudentGroupId]
                .push_back(conflict.firstStudentGroupId);
        }

        using StudentGroupDayKey =
            std::pair<StudentGroupId, int>;

        std::map<StudentGroupDayKey, int>
            lastRegularLessonByGroupAndDay;

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < chromosome.genes.size();
            ++lessonIndex)
        {
            const ScheduleSlotIndex scheduleSlotIndex =
                chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= scheduleSlots.size())
            {
                continue;
            }

            const LessonInstance& lessonInstance =
                lessonInstances[lessonIndex];

            const LessonRequirement& requirement =
                FindRequirementById(
                    problem,
                    lessonInstance.requirementId);

            if (requirement.isAdditional)
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                scheduleSlots[scheduleSlotIndex];

            const int dayIndex =
                static_cast<int>(
                    scheduleSlot.timeSlot.day);

            const int lessonNumber =
                scheduleSlot.timeSlot.lessonNumber;

            const auto affectedIterator =
                affectedStudentGroups.find(
                    requirement.studentGroupId);

            if (affectedIterator ==
                affectedStudentGroups.end())
            {
                continue;
            }

            for (const StudentGroupId affectedGroupId :
                affectedIterator->second)
            {
                const StudentGroupDayKey key =
                    { affectedGroupId, dayIndex };

                auto [iterator, inserted] =
                    lastRegularLessonByGroupAndDay.try_emplace(
                        key,
                        lessonNumber);

                if (!inserted)
                {
                    iterator->second =
                        std::max(
                            iterator->second,
                            lessonNumber);
                }
            }
        }

        const double basePenaltyPerSlot =
            static_cast<double>(
                problem.optimizationSettings.penalties.low);

        for (LessonInstanceIndex lessonIndex = 0;
            lessonIndex < chromosome.genes.size();
            ++lessonIndex)
        {
            const ScheduleSlotIndex scheduleSlotIndex =
                chromosome.genes[lessonIndex];

            if (scheduleSlotIndex >= scheduleSlots.size())
            {
                continue;
            }

            const LessonInstance& lessonInstance =
                lessonInstances[lessonIndex];

            const LessonRequirement& requirement =
                FindRequirementById(
                    problem,
                    lessonInstance.requirementId);

            if (!requirement.isAdditional)
            {
                continue;
            }

            const ScheduleSlot& scheduleSlot =
                scheduleSlots[scheduleSlotIndex];

            const int dayIndex =
                static_cast<int>(
                    scheduleSlot.timeSlot.day);

            const int lessonNumber =
                scheduleSlot.timeSlot.lessonNumber;

            const StudentGroupDayKey key =
                { requirement.studentGroupId, dayIndex };

            const auto lastRegularIterator =
                lastRegularLessonByGroupAndDay.find(key);

            if (lastRegularIterator ==
                lastRegularLessonByGroupAndDay.end())
            {
                continue;
            }

            const int lastRegularLesson =
                lastRegularIterator->second;

            if (lessonNumber >= lastRegularLesson)
            {
                continue;
            }

            const int distanceFromEnd =
                lastRegularLesson - lessonNumber;

            const double priorityMultiplier =
                LessonPriorityMultiplier(
                    requirement.priority);

            score.addSoftPenalty(
                basePenaltyPerSlot *
                priorityMultiplier *
                distanceFromEnd);
        }
    }

    ConstraintViolation CreateViolation(
        ConstraintViolationType type,
        std::string message)
    {
        ConstraintViolation violation;

        violation.type = type;
        violation.message = std::move(message);

        return violation;
    }
}

FitnessScore FitnessEvaluator::evaluate(
    const Chromosome& chromosome,
    const TimetableProblem& problem,
    const std::vector<LessonInstance>& lessonInstances,
    const std::vector<ScheduleSlot>& scheduleSlots) const
{
    FitnessScore score;

    /*
     * Chromosome representation:
     *
     * gene index = lesson instance index
     * gene value = assigned schedule slot index
     */
    if (chromosome.genes.size() !=
        lessonInstances.size())
    {
        ConstraintViolation violation =
            CreateViolation(
                ConstraintViolationType::
                InvalidChromosome,
                "Chromosome genes count is not equal " "to lesson instances count.");

        score.addHardViolation(std::move(violation));

        return score;
    }

    /*
     * ScheduleSlotIndex uniquely represents:
     *
     * room + day + lesson number
     */
    std::map<ScheduleSlotIndex, int> scheduleSlotUsage;

    std::map<TeacherTimeKey, int> teacherTimeUsage;

    std::map<StudentGroupTimeKey, int> studentGroupTimeUsage;

    std::map<TimeKey, std::set<StudentGroupId>> studentGroupsAtTime;

    for (LessonInstanceIndex lessonIndex = 0;
        lessonIndex < chromosome.genes.size();
        ++lessonIndex)
    {
        const ScheduleSlotIndex scheduleSlotIndex = chromosome.genes[lessonIndex];

        if (scheduleSlotIndex >=
            scheduleSlots.size())
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    InvalidScheduleSlot, "Schedule slot index is out of range.");

            score.addHardViolation(std::move(violation));

            continue;
        }

        const LessonInstance& lessonInstance = lessonInstances[lessonIndex];

        const LessonRequirement& requirement =
            FindRequirementById(problem, lessonInstance.requirementId);

        const ScheduleSlot& scheduleSlot = scheduleSlots[scheduleSlotIndex];

        const Room& room = FindRoomById(problem, scheduleSlot.roomId);

        const int dayIndex = static_cast<int>(scheduleSlot.timeSlot.day);

        const int slotIndex = scheduleSlot.timeSlot.lessonNumber;

        const TimeKey timeKey = std::make_pair(dayIndex, slotIndex);

        const TeacherTimeKey teacherTimeKey = std::make_pair(requirement.teacherId, timeKey);

        const StudentGroupTimeKey
            studentGroupTimeKey = std::make_pair(requirement.studentGroupId, timeKey);

        scheduleSlotUsage[scheduleSlotIndex]++;
        teacherTimeUsage[teacherTimeKey]++;
        studentGroupTimeUsage[studentGroupTimeKey]++;
        studentGroupsAtTime[timeKey].insert(requirement.studentGroupId);

        const TimeSlotPreferenceType teacherPreference =
            FindTimeSlotPreference(
                problem.teacherTimeSlotPreferences,
                requirement.teacherId, dayIndex, slotIndex, &TeacherTimeSlotPreference::teacherId);

        const TimeSlotPreferenceType classGroupPreference =
            FindStudentGroupClassPreference(
                problem, requirement.studentGroupId, dayIndex, slotIndex);

        const TimeSlotPreferenceType roomPreference =
            FindTimeSlotPreference(
                problem.roomTimeSlotPreferences,
                scheduleSlot.roomId, dayIndex, slotIndex, &RoomTimeSlotPreference::roomId);

        const TimeSlotPreferenceType subjectPreference =
            FindTimeSlotPreference(
                problem.subjectTimeSlotPreferences,
                requirement.subjectId, dayIndex, slotIndex, &SubjectTimeSlotPreference::subjectId);

        AddTimeSlotPreferencePenalty(
            score, teacherPreference, requirement.priority);
        AddTimeSlotPreferencePenalty(
            score, classGroupPreference, requirement.priority);
        AddTimeSlotPreferencePenalty(
            score, roomPreference, requirement.priority);
        AddTimeSlotPreferencePenalty(
            score, subjectPreference, requirement.priority);

        // Hard constraint: teacher is unavailable.
        if (teacherPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    TeacherUnavailable, "Teacher is unavailable at the " "assigned time.");

            violation.teacherId = requirement.teacherId;

            violation.classGroupId = requirement.classGroupId;

            violation.roomId = scheduleSlot.roomId;

            violation.dayIndex = dayIndex;

            violation.slotIndex = slotIndex;

            score.addHardViolation(std::move(violation));
        }

        // Hard constraint: class group is unavailable.
        if (classGroupPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    ClassGroupUnavailable, "Class group is unavailable at the " "assigned time.");

            violation.teacherId = requirement.teacherId;

            violation.classGroupId = requirement.classGroupId;

            violation.roomId = scheduleSlot.roomId;

            violation.dayIndex = dayIndex;

            violation.slotIndex = slotIndex;

            score.addHardViolation(std::move(violation));
        }

        // Hard constraint: room is unavailable.
        if (roomPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    RoomUnavailable, "Room is unavailable at the " "assigned time.");

            violation.teacherId = requirement.teacherId;

            violation.classGroupId = requirement.classGroupId;

            violation.roomId = scheduleSlot.roomId;

            violation.dayIndex = dayIndex;

            violation.slotIndex = slotIndex;

            score.addHardViolation(std::move(violation));
        }

        // Hard constraint: subject is unavailable.
        if (subjectPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    SubjectUnavailable, "Subject is unavailable at the " "assigned time.");

            violation.teacherId = requirement.teacherId;

            violation.classGroupId = requirement.classGroupId;

            violation.roomId = scheduleSlot.roomId;

            violation.subjectId = requirement.subjectId;

            violation.dayIndex = dayIndex;

            violation.slotIndex = slotIndex;

            score.addHardViolation(std::move(violation));
        }
    }

    /*
     * Hard constraint:
     * multiple lessons use the same room,
     * day and lesson number.
     */
    for (const auto& [scheduleSlotIndex,
        usageCount] :
        scheduleSlotUsage)
    {
        if (usageCount <= 1)
        {
            continue;
        }

        const ScheduleSlot& scheduleSlot = scheduleSlots[scheduleSlotIndex];

        ConstraintViolation violation =
            CreateViolation(
                ConstraintViolationType::
                RoomConflict,
                "Multiple lessons are assigned to " "the same room at the same time.");

        violation.roomId = scheduleSlot.roomId;

        violation.dayIndex = static_cast<int>(scheduleSlot.timeSlot.day);

        violation.slotIndex = scheduleSlot.timeSlot.lessonNumber;

        score.addHardViolation(std::move(violation), usageCount - 1);
    }

    /*
     * Hard constraint:
     * teacher is assigned to multiple lessons
     * at the same time.
     */
    for (const auto& [teacherTimeKey,
        usageCount] :
        teacherTimeUsage)
    {
        if (usageCount <= 1)
        {
            continue;
        }

        const TeacherId teacherId = teacherTimeKey.first;

        const int dayIndex = teacherTimeKey.second.first;

        const int slotIndex = teacherTimeKey.second.second;

        ConstraintViolation violation =
            CreateViolation(
                ConstraintViolationType::
                TeacherConflict, "Teacher is assigned to multiple " "lessons at the same time.");

        violation.teacherId = teacherId;

        violation.dayIndex = dayIndex;

        violation.slotIndex = slotIndex;

        score.addHardViolation(std::move(violation), usageCount - 1);
    }

    /* Hard constraint: the same student group has multiple lessons at the same time. */
    for (const auto& [studentGroupTimeKey, usageCount] : studentGroupTimeUsage)
    {
        if (usageCount <= 1) continue;
        ConstraintViolation violation = CreateViolation(
            ConstraintViolationType::StudentGroupConflict,
            "Student group is assigned to multiple lessons at the same time.");
        violation.studentGroupId = studentGroupTimeKey.first;
        violation.dayIndex = studentGroupTimeKey.second.first;
        violation.slotIndex = studentGroupTimeKey.second.second;
        score.addHardViolation(std::move(violation), usageCount - 1);
    }

    /* Hard constraint: overlapping student groups may not be scheduled simultaneously. */
    for (const auto& [timeKey, groups] : studentGroupsAtTime)
    {
        for (auto first = groups.begin(); first != groups.end(); ++first)
        {
            for (auto second = std::next(first); second != groups.end(); ++second)
            {
                if (!StudentGroupsConflict(problem, *first, *second)) continue;
                ConstraintViolation violation = CreateViolation(
                    ConstraintViolationType::StudentGroupConflict,
                    "Overlapping student groups are assigned lessons at the same time.");
                violation.studentGroupId = *first;
                violation.otherStudentGroupId = *second;
                violation.dayIndex = timeKey.first;
                violation.slotIndex = timeKey.second;
                score.addHardViolation(std::move(violation));
            }
        }
    }


    AddAdditionalLessonPlacementPenalty(
        score,
        chromosome,
        problem,
        lessonInstances,
        scheduleSlots);

    const TeacherScheduleStats teacherScheduleStats =
        TeacherScheduleStatsBuilder::build(chromosome, problem, lessonInstances, scheduleSlots);

    const ClassGroupScheduleStats classGroupScheduleStats =
        ClassGroupScheduleStatsBuilder::build(chromosome, problem, lessonInstances, scheduleSlots);

    const SubjectScheduleStats subjectScheduleStats =
        SubjectScheduleStatsBuilder::build(chromosome, problem, lessonInstances, scheduleSlots);

    const ConstraintRuleContext context{
        chromosome,
        problem,
        lessonInstances,
        scheduleSlots,
        teacherScheduleStats,
        classGroupScheduleStats,
        subjectScheduleStats
    };

    for (const auto& rule : ruleRegistry_.rules())
    {
        auto ruleResults = rule->evaluate(context);

        for (auto& ruleResult : ruleResults)
        {
            score.addRuleResult(std::move(ruleResult));
        }
    }

    return score;
}