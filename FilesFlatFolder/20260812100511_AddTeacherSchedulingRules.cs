using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherSchedulingRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvoidSingleLessonDay",
                table: "TeacherSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxConsecutiveLessons",
                table: "TeacherSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxConsecutiveLessonsLimit",
                table: "TeacherSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxLessonsPerDay",
                table: "TeacherSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxLessonsPerDayLimit",
                table: "TeacherSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeacherAvoidSingleLessonDay",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TeacherMaxConsecutiveLessons",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "TeacherMaxConsecutiveLessonsLimit",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.AddColumn<int>(
                name: "TeacherMaxLessonsPerDay",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "TeacherMaxLessonsPerDayLimit",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 6);

            migrationBuilder.AddCheckConstraint(
                name: "CK_TeacherSchedulingPreferences_MaxConsecutiveLessonsLimit",
                table: "TeacherSchedulingPreferences",
                sql: "\"MaxConsecutiveLessonsLimit\" IS NULL OR (\"MaxConsecutiveLessonsLimit\" >= 1 AND \"MaxConsecutiveLessonsLimit\" <= 8)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TeacherSchedulingPreferences_MaxLessonsPerDayLimit",
                table: "TeacherSchedulingPreferences",
                sql: "\"MaxLessonsPerDayLimit\" IS NULL OR (\"MaxLessonsPerDayLimit\" >= 1 AND \"MaxLessonsPerDayLimit\" <= 8)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_MaxConsecutiveLessonsLimit",
                table: "OrganizationSchedulingPreferences",
                sql: "\"TeacherMaxConsecutiveLessonsLimit\" >= 1 AND \"TeacherMaxConsecutiveLessonsLimit\" <= 8");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_MaxLessonsPerDayLimit",
                table: "OrganizationSchedulingPreferences",
                sql: "\"TeacherMaxLessonsPerDayLimit\" >= 1 AND \"TeacherMaxLessonsPerDayLimit\" <= 8");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_TeacherSchedulingPreferences_MaxConsecutiveLessonsLimit",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropCheckConstraint(
                name: "CK_TeacherSchedulingPreferences_MaxLessonsPerDayLimit",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_MaxConsecutiveLessonsLimit",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_MaxLessonsPerDayLimit",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "AvoidSingleLessonDay",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "MaxConsecutiveLessons",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "MaxConsecutiveLessonsLimit",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "MaxLessonsPerDay",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "MaxLessonsPerDayLimit",
                table: "TeacherSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "TeacherAvoidSingleLessonDay",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "TeacherMaxConsecutiveLessons",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "TeacherMaxConsecutiveLessonsLimit",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "TeacherMaxLessonsPerDay",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "TeacherMaxLessonsPerDayLimit",
                table: "OrganizationSchedulingPreferences");
        }
    }
}
