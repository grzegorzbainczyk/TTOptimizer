using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.ClassGroups;
using TTOptimizer.Web.Models.DTO.ResourceTimeSlotPreferences;
using TTOptimizer.Web.Models.DTO.SchedulingPreferences;
using TTOptimizer.Web.Models.DTO.Import;
using TTOptimizer.Web.Services;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClassesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClassGroupDTO>>> GetClasses(
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var classes = await _db.ClassGroups
            .AsNoTracking()
            .Where(classGroup =>
                classGroup.OrganizationId == organizationId)
            .OrderBy(classGroup => classGroup.Name)
            .Select(classGroup => new ClassGroupDTO
            {
                Id = classGroup.Id,
                SchoolUnitId = classGroup.SchoolUnitId,
                SchoolUnitName = classGroup.SchoolUnit.Name,
                Name = classGroup.Name,
                Grade = classGroup.Grade,
                Info = classGroup.Info,

                HomeroomTeacherId =
                    classGroup.HomeroomTeacherId,

                HomeroomTeacherName =
                    classGroup.HomeroomTeacher != null
                        ? classGroup.HomeroomTeacher.Name
                        : null,

                DefaultRoomId =
                    classGroup.DefaultRoomId,

                DefaultRoomName =
                    classGroup.DefaultRoom != null
                        ? classGroup.DefaultRoom.Name
                        : null
            })
            .ToListAsync();

        return Ok(classes);
    }

    [HttpPost]
    public async Task<ActionResult<ClassGroupDTO>> CreateClass(
        [FromQuery] int organizationId,
        [FromBody] CreateClassGroupRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var validationResult = await ValidateRequestAsync(
            organizationId,
            request.SchoolUnitId,
            request.Name,
            request.Grade,
            request.HomeroomTeacherId,
            request.DefaultRoomId
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var nameAlreadyExists = await _db.ClassGroups
            .AnyAsync(classGroup =>
                classGroup.OrganizationId == organizationId &&
                classGroup.Name.ToLower() ==
                normalizedName.ToLower()
            );

        if (nameAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        var classGroup = new ClassGroup
        {
            OrganizationId = organizationId,
            SchoolUnitId = request.SchoolUnitId,
            Name = normalizedName,
            Grade = request.Grade,
            Info = NormalizeOptionalText(request.Info),
            HomeroomTeacherId = request.HomeroomTeacherId,
            DefaultRoomId = request.DefaultRoomId
        };

        _db.ClassGroups.Add(classGroup);

        _db.StudentGroups.Add(new StudentGroup
        {
            OrganizationId = organizationId,
            Name = normalizedName,
            Type = StudentGroupType.WholeClass,
            ClassGroup = classGroup
        });

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        var result = await GetClassDTOAsync(
            classGroup.Id,
            organizationId
        );

        return CreatedAtAction(
            nameof(GetClass),
            new
            {
                id = classGroup.Id,
                organizationId
            },
            result
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClassGroupDTO>> GetClass(
        int id,
        [FromQuery] int organizationId)
    {
        var classGroup = await GetClassDTOAsync(
            id,
            organizationId
        );

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        return Ok(classGroup);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClassGroupDTO>> UpdateClass(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateClassGroupRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var classGroup = await _db.ClassGroups
            .FirstOrDefaultAsync(classGroup =>
                classGroup.Id == id &&
                classGroup.OrganizationId == organizationId
            );

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        var validationResult = await ValidateRequestAsync(
            organizationId,
            request.SchoolUnitId,
            request.Name,
            request.Grade,
            request.HomeroomTeacherId,
            request.DefaultRoomId
        );

        if (validationResult != null)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();

        var nameAlreadyExists = await _db.ClassGroups
            .AnyAsync(otherClassGroup =>
                otherClassGroup.OrganizationId ==
                    organizationId &&
                otherClassGroup.Id != id &&
                otherClassGroup.Name.ToLower() ==
                    normalizedName.ToLower()
            );

        if (nameAlreadyExists)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        classGroup.SchoolUnitId = request.SchoolUnitId;
        classGroup.Name = normalizedName;
        classGroup.Grade = request.Grade;
        classGroup.Info =
            NormalizeOptionalText(request.Info);

        classGroup.HomeroomTeacherId =
            request.HomeroomTeacherId;

        classGroup.DefaultRoomId =
            request.DefaultRoomId;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message =
                    $"Class '{normalizedName}' already exists."
            });
        }

        var result = await GetClassDTOAsync(
            classGroup.Id,
            organizationId
        );

        return Ok(result);
    }



    [HttpPost("import/preview")]
    public IActionResult PreviewImport(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "File is required."
            });
        }

        var extension = Path.GetExtension(file.FileName);

        if (!string.Equals(extension, ".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                success = false,
                message = "Only .xlsx files are supported."
            });
        }

        try
        {
            using var stream = file.OpenReadStream();

            var preview = XlsxImportService.ReadSingleNameColumnPreview(
                stream,
                expectedHeader: "Name",
                maxNameLength: 50);

            if (!preview.Success)
            {
                return BadRequest(preview);
            }

            return Ok(preview);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Could not read class import file: {error}");

            return BadRequest(new
            {
                success = false,
                message = "The XLSX file could not be read. Make sure it is a valid spreadsheet."
            });
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportClasses(
        [FromQuery] int organizationId,
        [FromQuery] int schoolUnitId,
        [FromBody] SimpleNameImportRequestDto request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var organizationExists = await _db.Organizations.AnyAsync(
            organization => organization.Id == organizationId);

        if (!organizationExists)
        {
            return NotFound(new
            {
                success = false,
                message = "Organization was not found."
            });
        }

        var schoolUnit = await _db.SchoolUnits
            .AsNoTracking()
            .Where(item =>
                item.Id == schoolUnitId &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.SchoolType
            })
            .FirstOrDefaultAsync();

        if (schoolUnit == null)
        {
            return BadRequest(new
            {
                success = false,
                message = "A valid school is required for class import."
            });
        }

        var requestedNames = request.Names
            .Select(name => name?.Trim() ?? string.Empty)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Where(name => name.Length <= 50)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requestedNames.Count == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "There are no valid class names to import."
            });
        }

        var existingNames = await _db.ClassGroups
            .Where(classGroup => classGroup.OrganizationId == organizationId)
            .Select(classGroup => classGroup.Name)
            .ToListAsync();

        var existingNameSet = new HashSet<string>(
            existingNames,
            StringComparer.OrdinalIgnoreCase);

        var namesToImport = requestedNames
            .Where(name => !existingNameSet.Contains(name))
            .ToList();

        var skippedExistingCount = requestedNames.Count - namesToImport.Count;

        if (namesToImport.Count == 0)
        {
            return Ok(new
            {
                success = true,
                importedCount = 0,
                skippedExistingCount
            });
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            foreach (var name in namesToImport)
            {
                var classGroup = new ClassGroup
                {
                    OrganizationId = organizationId,
                    SchoolUnitId = schoolUnitId,
                    Name = name,
                    Grade = InferGradeFromClassName(name, schoolUnit.SchoolType),
                    Info = null,
                    HomeroomTeacherId = null,
                    DefaultRoomId = null
                };

                _db.ClassGroups.Add(classGroup);

                _db.StudentGroups.Add(new StudentGroup
                {
                    OrganizationId = organizationId,
                    Name = name,
                    Type = StudentGroupType.WholeClass,
                    ClassGroup = classGroup
                });
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();

            return Conflict(new
            {
                success = false,
                message = "One or more classes already exist."
            });
        }

        return Ok(new
        {
            success = true,
            importedCount = namesToImport.Count,
            skippedExistingCount
        });
    }
    [HttpGet("{id:int}/time-slot-preferences")]
    public async Task<IActionResult> GetTimeSlotPreferences(
        int id,
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var classGroup = await _db.ClassGroups
            .AsNoTracking()
            .Where(item =>
                item.Id == id &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        var timeSlotPreferences =
            await _db.ClassGroupTimeSlotPreferences
                .AsNoTracking()
                .Where(item => item.ClassGroupId == id)
                .OrderBy(item => item.DayIndex)
                .ThenBy(item => item.SlotIndex)
                .Select(item => new TimeSlotPreferenceDTO
                {
                    DayIndex = item.DayIndex,
                    SlotIndex = item.SlotIndex,
                    PreferenceType = item.PreferenceType
                })
                .ToListAsync();

        return Ok(new
        {
            resourceType = "class",
            resourceId = classGroup.Id,
            resourceName = classGroup.Name,
            timeSlotPreferences
        });
    }

    [HttpPut("{id:int}/time-slot-preferences")]
    public async Task<IActionResult> UpdateTimeSlotPreferences(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateTimeSlotPreferencesRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var resourceExists =
            await _db.ClassGroups.AnyAsync(item =>
                item.Id == id &&
                item.OrganizationId == organizationId);

        if (!resourceExists)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        if (request.TimeSlotPreferences == null)
        {
            return BadRequest(new
            {
                message = "Time slot preferences collection is required."
            });
        }

        var invalidSlot = request.TimeSlotPreferences
            .FirstOrDefault(slot =>
                slot.DayIndex < 0 ||
                slot.DayIndex > 4 ||
                slot.SlotIndex < 0 ||
                slot.SlotIndex > 7 ||
                !Enum.IsDefined(slot.PreferenceType));

        if (invalidSlot != null)
        {
            return BadRequest(new
            {
                message =
                    "Day index must be between 0 and 4, slot index between 0 and 7, " +
                    "and preference type must be valid."
            });
        }

        var normalizedPreferences = request.TimeSlotPreferences
            .GroupBy(slot => new
            {
                slot.DayIndex,
                slot.SlotIndex
            })
            .Select(group => group.First())
            .ToList();

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        var existingPreferences =
            await _db.ClassGroupTimeSlotPreferences
                .Where(item => item.ClassGroupId == id)
                .ToListAsync();

        _db.ClassGroupTimeSlotPreferences.RemoveRange(existingPreferences);

        var newPreferences = normalizedPreferences
            .Select(slot => new ClassGroupTimeSlotPreference
            {
                ClassGroupId = id,
                DayIndex = slot.DayIndex,
                SlotIndex = slot.SlotIndex,
                PreferenceType = slot.PreferenceType
            })
            .ToList();

        _db.ClassGroupTimeSlotPreferences.AddRange(newPreferences);

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            message = "Class time slot preferences were updated.",
            timeSlotPreferences = normalizedPreferences
                .OrderBy(slot => slot.DayIndex)
                .ThenBy(slot => slot.SlotIndex)
        });
    }


    [HttpGet("{id:int}/scheduling-preferences")]
    public async Task<IActionResult> GetSchedulingPreferences(
        int id,
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        var classGroup = await _db.ClassGroups
            .AsNoTracking()
            .Where(item =>
                item.Id == id &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (classGroup == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Class was not found."
            });
        }

        var organizationDefaults =
            await _db.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        var classGroupPreferences =
            await _db.ClassGroupSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.ClassGroupId == id);

        return Ok(new
        {
            success = true,
            preferences = CreateClassGroupSchedulingPreferencesDto(
                classGroup.Id,
                classGroup.Name,
                organizationDefaults,
                classGroupPreferences)
        });
    }

    [HttpPut("{id:int}/scheduling-preferences")]
    public async Task<IActionResult> UpdateSchedulingPreferences(
        int id,
        [FromQuery] int organizationId,
        [FromBody] UpdateClassGroupSchedulingPreferencesRequest request)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Organization ID is required."
            });
        }

        if (!IsValidOptionalLevel(request.MinimizeGaps) ||
            !IsValidOptionalLevel(request.AvoidSingleLessonDay) ||
            !IsValidOptionalLevel(request.MaxConsecutiveLessons) ||
            !IsValidOptionalLevel(request.MaxLessonsPerDay))
        {
            return BadRequest(new
            {
                success = false,
                message = "One or more scheduling preference levels are invalid."
            });
        }

        if (!IsValidOptionalLimit(request.MaxConsecutiveLessonsLimit) ||
            !IsValidOptionalLimit(request.MaxLessonsPerDayLimit))
        {
            return BadRequest(new
            {
                success = false,
                message = "Lesson limits must be between 1 and 8 or left empty to use the organization default."
            });
        }

        var classGroup = await _db.ClassGroups
            .Where(item =>
                item.Id == id &&
                item.OrganizationId == organizationId)
            .Select(item => new
            {
                item.Id,
                item.Name
            })
            .FirstOrDefaultAsync();

        if (classGroup == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Class was not found."
            });
        }

        var preferences =
            await _db.ClassGroupSchedulingPreferences
                .FirstOrDefaultAsync(item =>
                    item.ClassGroupId == id);

        if (preferences == null)
        {
            preferences = new ClassGroupSchedulingPreferences
            {
                ClassGroupId = id
            };

            _db.ClassGroupSchedulingPreferences.Add(preferences);
        }

        preferences.MinimizeGaps = request.MinimizeGaps;
        preferences.AvoidSingleLessonDay = request.AvoidSingleLessonDay;
        preferences.MaxConsecutiveLessons = request.MaxConsecutiveLessons;
        preferences.MaxConsecutiveLessonsLimit = request.MaxConsecutiveLessonsLimit;
        preferences.MaxLessonsPerDay = request.MaxLessonsPerDay;
        preferences.MaxLessonsPerDayLimit = request.MaxLessonsPerDayLimit;

        await _db.SaveChangesAsync();

        var organizationDefaults =
            await _db.OrganizationSchedulingPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.OrganizationId == organizationId);

        return Ok(new
        {
            success = true,
            message = "Class scheduling preferences were saved.",
            preferences = CreateClassGroupSchedulingPreferencesDto(
                classGroup.Id,
                classGroup.Name,
                organizationDefaults,
                preferences)
        });
    }

    private static ClassGroupSchedulingPreferencesDto
        CreateClassGroupSchedulingPreferencesDto(
            int classGroupId,
            string classGroupName,
            OrganizationSchedulingPreferences? defaults,
            ClassGroupSchedulingPreferences? preferences)
    {
        var defaultMinimizeGaps =
            defaults?.ClassGroupMinimizeGaps
            ?? SchedulingPreferenceLevel.Medium;

        var defaultAvoidSingleLessonDay =
            defaults?.ClassGroupAvoidSingleLessonDay
            ?? SchedulingPreferenceLevel.Disabled;

        var defaultMaxConsecutiveLessons =
            defaults?.ClassGroupMaxConsecutiveLessons
            ?? SchedulingPreferenceLevel.Medium;

        var defaultMaxConsecutiveLessonsLimit =
            defaults?.ClassGroupMaxConsecutiveLessonsLimit
            ?? 6;

        var defaultMaxLessonsPerDay =
            defaults?.ClassGroupMaxLessonsPerDay
            ?? SchedulingPreferenceLevel.High;

        var defaultMaxLessonsPerDayLimit =
            defaults?.ClassGroupMaxLessonsPerDayLimit
            ?? 8;

        return new ClassGroupSchedulingPreferencesDto
        {
            ClassGroupId = classGroupId,
            ClassGroupName = classGroupName,

            MinimizeGaps = preferences?.MinimizeGaps,
            DefaultMinimizeGaps = defaultMinimizeGaps,
            EffectiveMinimizeGaps =
                preferences?.MinimizeGaps
                ?? defaultMinimizeGaps,

            AvoidSingleLessonDay =
                preferences?.AvoidSingleLessonDay,
            DefaultAvoidSingleLessonDay =
                defaultAvoidSingleLessonDay,
            EffectiveAvoidSingleLessonDay =
                preferences?.AvoidSingleLessonDay
                ?? defaultAvoidSingleLessonDay,

            MaxConsecutiveLessons =
                preferences?.MaxConsecutiveLessons,
            DefaultMaxConsecutiveLessons =
                defaultMaxConsecutiveLessons,
            EffectiveMaxConsecutiveLessons =
                preferences?.MaxConsecutiveLessons
                ?? defaultMaxConsecutiveLessons,

            MaxConsecutiveLessonsLimit =
                preferences?.MaxConsecutiveLessonsLimit,
            DefaultMaxConsecutiveLessonsLimit =
                defaultMaxConsecutiveLessonsLimit,
            EffectiveMaxConsecutiveLessonsLimit =
                preferences?.MaxConsecutiveLessonsLimit
                ?? defaultMaxConsecutiveLessonsLimit,

            MaxLessonsPerDay =
                preferences?.MaxLessonsPerDay,
            DefaultMaxLessonsPerDay =
                defaultMaxLessonsPerDay,
            EffectiveMaxLessonsPerDay =
                preferences?.MaxLessonsPerDay
                ?? defaultMaxLessonsPerDay,

            MaxLessonsPerDayLimit =
                preferences?.MaxLessonsPerDayLimit,
            DefaultMaxLessonsPerDayLimit =
                defaultMaxLessonsPerDayLimit,
            EffectiveMaxLessonsPerDayLimit =
                preferences?.MaxLessonsPerDayLimit
                ?? defaultMaxLessonsPerDayLimit
        };
    }

    private static bool IsValidOptionalLevel(
        SchedulingPreferenceLevel? value)
    {
        return value == null || Enum.IsDefined(value.Value);
    }

    private static bool IsValidOptionalLimit(int? value)
    {
        return value == null || value is >= 1 and <= 8;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteClass(
        int id,
        [FromQuery] int organizationId)
    {
        if (organizationId <= 0)
        {
            return BadRequest(new
            {
                message = "Organization ID is required."
            });
        }

        var classGroup = await _db.ClassGroups
            .FirstOrDefaultAsync(classGroup =>
                classGroup.Id == id &&
                classGroup.OrganizationId == organizationId
            );

        if (classGroup == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        var isUsedInRequirements =
            await _db.LessonRequirements
                .AnyAsync(requirement =>
                    requirement.OrganizationId ==
                        organizationId &&
                    requirement.ClassGroupId == id
                );

        if (isUsedInRequirements)
        {
            return Conflict(new
            {
                message =
                    "The class cannot be deleted because it is " +
                    "used in lesson requirements."
            });
        }

        _db.ClassGroups.Remove(classGroup);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?> ValidateRequestAsync(
        int organizationId,
        int schoolUnitId,
        string? name,
        int grade,
        int? homeroomTeacherId,
        int? defaultRoomId)
    {
        var schoolType = await _db.SchoolUnits
            .Where(schoolUnit =>
                schoolUnit.Id == schoolUnitId &&
                schoolUnit.OrganizationId == organizationId)
            .Select(schoolUnit => (SchoolType?)schoolUnit.SchoolType)
            .FirstOrDefaultAsync();

        if (!schoolType.HasValue)
        {
            return BadRequest(new
            {
                message = "The selected school does not exist."
            });
        }

        var maxGrade = GetMaxGrade(schoolType.Value);

        if (grade < 1 || grade > maxGrade)
        {
            return BadRequest(new
            {
                message =
                    $"Grade must be between 1 and {maxGrade} for the selected school type."
            });
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Class name is required."
            });
        }

        if (name.Trim().Length > 50)
        {
            return BadRequest(new
            {
                message =
                    "Class name cannot contain more than 50 characters."
            });
        }

        if (homeroomTeacherId.HasValue)
        {
            var teacherExists = await _db.Teachers
                .AnyAsync(teacher =>
                    teacher.Id == homeroomTeacherId.Value &&
                    teacher.OrganizationId == organizationId
                );

            if (!teacherExists)
            {
                return BadRequest(new
                {
                    message =
                        "The selected homeroom teacher does not exist."
                });
            }
        }

        if (defaultRoomId.HasValue)
        {
            var roomExists = await _db.Rooms
                .AnyAsync(room =>
                    room.Id == defaultRoomId.Value &&
                    room.OrganizationId == organizationId
                );

            if (!roomExists)
            {
                return BadRequest(new
                {
                    message =
                        "The selected default room does not exist."
                });
            }
        }

        return null;
    }

    private async Task<ClassGroupDTO?> GetClassDTOAsync(
        int id,
        int organizationId)
    {
        return await _db.ClassGroups
            .AsNoTracking()
            .Where(classGroup =>
                classGroup.Id == id &&
                classGroup.OrganizationId == organizationId)
            .Select(classGroup => new ClassGroupDTO
            {
                Id = classGroup.Id,
                SchoolUnitId = classGroup.SchoolUnitId,
                SchoolUnitName = classGroup.SchoolUnit.Name,
                Name = classGroup.Name,
                Grade = classGroup.Grade,
                Info = classGroup.Info,

                HomeroomTeacherId =
                    classGroup.HomeroomTeacherId,

                HomeroomTeacherName =
                    classGroup.HomeroomTeacher != null
                        ? classGroup.HomeroomTeacher.Name
                        : null,

                DefaultRoomId =
                    classGroup.DefaultRoomId,

                DefaultRoomName =
                    classGroup.DefaultRoom != null
                        ? classGroup.DefaultRoom.Name
                        : null
            })
            .FirstOrDefaultAsync();
    }

    private static int GetMaxGrade(SchoolType schoolType)
    {
        return schoolType switch
        {
            SchoolType.PrimarySchool => 8,
            SchoolType.GeneralSecondarySchool => 4,
            SchoolType.TechnicalSecondarySchool => 5,
            SchoolType.VocationalSchoolFirstDegree => 3,
            SchoolType.VocationalSchoolSecondDegree => 2,
            _ => 1
        };
    }

    private static int? InferGradeFromClassName(
        string? className,
        SchoolType schoolType)
    {
        if (string.IsNullOrWhiteSpace(className))
        {
            return null;
        }

        var trimmed = className.Trim();
        var digits = new string(
            trimmed.TakeWhile(char.IsDigit).ToArray());

        if (!int.TryParse(digits, out var grade))
        {
            return null;
        }

        var maxGrade = GetMaxGrade(schoolType);

        return grade >= 1 && grade <= maxGrade
            ? grade
            : null;
    }

    private static string? NormalizeOptionalText(
        string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}