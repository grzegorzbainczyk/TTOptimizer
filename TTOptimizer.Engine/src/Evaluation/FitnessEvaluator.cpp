#include <algorithm>
#include <map>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "Evaluation/FitnessEvaluator.h"
#include "Evaluation/Rules/ConstraintRuleContext.h"
#include "Evaluation/Rules/TeacherScheduleStatsBuilder.h"
#include "Evaluation/Rules/ClassGroupScheduleStatsBuilder.h"
#include "Evaluation/Rules/SubjectScheduleStatsBuilder.h"

namespace
{
    using TimeKey = std::pair<int, int>;
    using TeacherTimeKey =
        std::pair<TeacherId, TimeKey>;
    using ClassGroupTimeKey =
        std::pair<ClassGroupId, TimeKey>;

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
                return requirement.id ==
                    requirementId;
            });

        if (iterator ==
            problem.lessonRequirements.end())
        {
            throw std::runtime_error(
                "Lesson requirement not found.");
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
            throw std::runtime_error(
                "Room not found.");
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
                    && preference.dayIndex == dayIndex
                    && preference.slotIndex == slotIndex;
            });

        if (iterator == preferences.end())
        {
            return TimeSlotPreferenceType::Available;
        }

        return iterator->preferenceType;
    }

    void AddTimeSlotPreferencePenalty(
        FitnessScore& score,
        TimeSlotPreferenceType preferenceType)
    {
        switch (preferenceType)
        {
        case TimeSlotPreferenceType::Preferred:
            return;

        case TimeSlotPreferenceType::Available:
            score.addSoftPenalty(1.0);
            return;

        case TimeSlotPreferenceType::NotPreferred:
            score.addSoftPenalty(10.0);
            return;

        case TimeSlotPreferenceType::Unavailable:
            // Hard violations are reported separately.
            return;
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
                "Chromosome genes count is not equal "
                "to lesson instances count.");

        score.addHardViolation(
            std::move(violation));

        return score;
    }

    /*
     * ScheduleSlotIndex uniquely represents:
     *
     * room + day + lesson number
     */
    std::map<ScheduleSlotIndex, int>
        scheduleSlotUsage;

    std::map<TeacherTimeKey, int>
        teacherTimeUsage;

    std::map<ClassGroupTimeKey, int>
        classGroupTimeUsage;

    for (LessonInstanceIndex lessonIndex = 0;
        lessonIndex < chromosome.genes.size();
        ++lessonIndex)
    {
        const ScheduleSlotIndex scheduleSlotIndex =
            chromosome.genes[lessonIndex];

        if (scheduleSlotIndex >=
            scheduleSlots.size())
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    InvalidScheduleSlot,
                    "Schedule slot index is out of range.");

            score.addHardViolation(
                std::move(violation));

            continue;
        }

        const LessonInstance& lessonInstance =
            lessonInstances[lessonIndex];

        const LessonRequirement& requirement =
            FindRequirementById(
                problem,
                lessonInstance.requirementId);

        const ScheduleSlot& scheduleSlot =
            scheduleSlots[scheduleSlotIndex];

        const Room& room =
            FindRoomById(
                problem,
                scheduleSlot.roomId);

        const int dayIndex =
            static_cast<int>(
                scheduleSlot.timeSlot.day);

        const int slotIndex =
            scheduleSlot.timeSlot.lessonNumber;

        const TimeKey timeKey =
            std::make_pair(
                dayIndex,
                slotIndex);

        const TeacherTimeKey teacherTimeKey =
            std::make_pair(
                requirement.teacherId,
                timeKey);

        const ClassGroupTimeKey
            classGroupTimeKey =
            std::make_pair(
                requirement.classGroupId,
                timeKey);

        scheduleSlotUsage[scheduleSlotIndex]++;
        teacherTimeUsage[teacherTimeKey]++;
        classGroupTimeUsage[classGroupTimeKey]++;

        const TimeSlotPreferenceType teacherPreference =
            FindTimeSlotPreference(
                problem.teacherTimeSlotPreferences,
                requirement.teacherId,
                dayIndex,
                slotIndex,
                &TeacherTimeSlotPreference::teacherId);

        const TimeSlotPreferenceType classGroupPreference =
            FindTimeSlotPreference(
                problem.classGroupTimeSlotPreferences,
                requirement.classGroupId,
                dayIndex,
                slotIndex,
                &ClassGroupTimeSlotPreference::classGroupId);

        const TimeSlotPreferenceType roomPreference =
            FindTimeSlotPreference(
                problem.roomTimeSlotPreferences,
                scheduleSlot.roomId,
                dayIndex,
                slotIndex,
                &RoomTimeSlotPreference::roomId);

        const TimeSlotPreferenceType subjectPreference =
            FindTimeSlotPreference(
                problem.subjectTimeSlotPreferences,
                requirement.subjectId,
                dayIndex,
                slotIndex,
                &SubjectTimeSlotPreference::subjectId);

        AddTimeSlotPreferencePenalty(score, teacherPreference);
        AddTimeSlotPreferencePenalty(score, classGroupPreference);
        AddTimeSlotPreferencePenalty(score, roomPreference);
        AddTimeSlotPreferencePenalty(score, subjectPreference);

        // Hard constraint: teacher is unavailable.
        if (teacherPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    TeacherUnavailable,
                    "Teacher is unavailable at the "
                    "assigned time.");

            violation.teacherId =
                requirement.teacherId;

            violation.classGroupId =
                requirement.classGroupId;

            violation.roomId =
                scheduleSlot.roomId;

            violation.dayIndex =
                dayIndex;

            violation.slotIndex =
                slotIndex;

            score.addHardViolation(
                std::move(violation));
        }

        // Hard constraint: class group is unavailable.
        if (classGroupPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    ClassGroupUnavailable,
                    "Class group is unavailable at the "
                    "assigned time.");

            violation.teacherId =
                requirement.teacherId;

            violation.classGroupId =
                requirement.classGroupId;

            violation.roomId =
                scheduleSlot.roomId;

            violation.dayIndex =
                dayIndex;

            violation.slotIndex =
                slotIndex;

            score.addHardViolation(
                std::move(violation));
        }

        // Hard constraint: room is unavailable.
        if (roomPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    RoomUnavailable,
                    "Room is unavailable at the "
                    "assigned time.");

            violation.teacherId =
                requirement.teacherId;

            violation.classGroupId =
                requirement.classGroupId;

            violation.roomId =
                scheduleSlot.roomId;

            violation.dayIndex =
                dayIndex;

            violation.slotIndex =
                slotIndex;

            score.addHardViolation(
                std::move(violation));
        }

        // Hard constraint: subject is unavailable.
        if (subjectPreference ==
            TimeSlotPreferenceType::Unavailable)
        {
            ConstraintViolation violation =
                CreateViolation(
                    ConstraintViolationType::
                    SubjectUnavailable,
                    "Subject is unavailable at the "
                    "assigned time.");

            violation.teacherId =
                requirement.teacherId;

            violation.classGroupId =
                requirement.classGroupId;

            violation.roomId =
                scheduleSlot.roomId;

            violation.subjectId =
                requirement.subjectId;

            violation.dayIndex =
                dayIndex;

            violation.slotIndex =
                slotIndex;

            score.addHardViolation(
                std::move(violation));
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

        const ScheduleSlot& scheduleSlot =
            scheduleSlots[scheduleSlotIndex];

        ConstraintViolation violation =
            CreateViolation(
                ConstraintViolationType::
                RoomConflict,
                "Multiple lessons are assigned to "
                "the same room at the same time.");

        violation.roomId =
            scheduleSlot.roomId;

        violation.dayIndex =
            static_cast<int>(
                scheduleSlot.timeSlot.day);

        violation.slotIndex =
            scheduleSlot.timeSlot.lessonNumber;

        score.addHardViolation(
            std::move(violation),
            usageCount - 1);
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

        const TeacherId teacherId =
            teacherTimeKey.first;

        const int dayIndex =
            teacherTimeKey.second.first;

        const int slotIndex =
            teacherTimeKey.second.second;

        ConstraintViolation violation =
            CreateViolation(
                ConstraintViolationType::
                TeacherConflict,
                "Teacher is assigned to multiple "
                "lessons at the same time.");

        violation.teacherId =
            teacherId;

        violation.dayIndex =
            dayIndex;

        violation.slotIndex =
            slotIndex;

        score.addHardViolation(
            std::move(violation),
            usageCount - 1);
    }

    /*
     * Hard constraint:
     * class group is assigned to multiple lessons
     * at the same time.
     */
    for (const auto& [classGroupTimeKey,
        usageCount] :
        classGroupTimeUsage)
    {
        if (usageCount <= 1)
        {
            continue;
        }

        const ClassGroupId classGroupId =
            classGroupTimeKey.first;

        const int dayIndex =
            classGroupTimeKey.second.first;

        const int slotIndex =
            classGroupTimeKey.second.second;

        ConstraintViolation violation =
            CreateViolation(
                ConstraintViolationType::
                ClassGroupConflict,
                "Class group is assigned to multiple "
                "lessons at the same time.");

        violation.classGroupId =
            classGroupId;

        violation.dayIndex =
            dayIndex;

        violation.slotIndex =
            slotIndex;

        score.addHardViolation(
            std::move(violation),
            usageCount - 1);
    }


    const TeacherScheduleStats teacherScheduleStats =
        TeacherScheduleStatsBuilder::build(
            chromosome,
            problem,
            lessonInstances,
            scheduleSlots);

    const ClassGroupScheduleStats classGroupScheduleStats =
        ClassGroupScheduleStatsBuilder::build(
            chromosome,
            problem,
            lessonInstances,
            scheduleSlots);

    const SubjectScheduleStats subjectScheduleStats =
        SubjectScheduleStatsBuilder::build(
            chromosome,
            problem,
            lessonInstances,
            scheduleSlots);

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
        auto ruleResults =
            rule->evaluate(context);

        for (auto& ruleResult : ruleResults)
        {
            score.addRuleResult(
                std::move(ruleResult));
        }
    }

    return score;
}
