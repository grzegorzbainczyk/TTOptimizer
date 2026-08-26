using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddClassGroupSchedulingRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClassGroupAvoidSingleLessonDay",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ClassGroupMaxConsecutiveLessons",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "ClassGroupMaxConsecutiveLessonsLimit",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 6);

            migrationBuilder.AddColumn<int>(
                name: "ClassGroupMaxLessonsPerDay",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "ClassGroupMaxLessonsPerDayLimit",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 8);

            migrationBuilder.AddColumn<int>(
                name: "ClassGroupMinimizeGaps",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.CreateTable(
                name: "ClassGroupSchedulingPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClassGroupId = table.Column<int>(type: "integer", nullable: false),
                    MinimizeGaps = table.Column<int>(type: "integer", nullable: true),
                    AvoidSingleLessonDay = table.Column<int>(type: "integer", nullable: true),
                    MaxConsecutiveLessons = table.Column<int>(type: "integer", nullable: true),
                    MaxConsecutiveLessonsLimit = table.Column<int>(type: "integer", nullable: true),
                    MaxLessonsPerDay = table.Column<int>(type: "integer", nullable: true),
                    MaxLessonsPerDayLimit = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassGroupSchedulingPreferences", x => x.Id);
                    table.CheckConstraint("CK_ClassGroupSchedulingPreferences_MaxConsecutiveLessonsLimit", "\"MaxConsecutiveLessonsLimit\" IS NULL OR (\"MaxConsecutiveLessonsLimit\" >= 1 AND \"MaxConsecutiveLessonsLimit\" <= 8)");
                    table.CheckConstraint("CK_ClassGroupSchedulingPreferences_MaxLessonsPerDayLimit", "\"MaxLessonsPerDayLimit\" IS NULL OR (\"MaxLessonsPerDayLimit\" >= 1 AND \"MaxLessonsPerDayLimit\" <= 8)");
                    table.ForeignKey(
                        name: "FK_ClassGroupSchedulingPreferences_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_ClassGroupMaxConsecutiveL~",
                table: "OrganizationSchedulingPreferences",
                sql: "\"ClassGroupMaxConsecutiveLessonsLimit\" >= 1 AND \"ClassGroupMaxConsecutiveLessonsLimit\" <= 8");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_ClassGroupMaxLessonsPerDa~",
                table: "OrganizationSchedulingPreferences",
                sql: "\"ClassGroupMaxLessonsPerDayLimit\" >= 1 AND \"ClassGroupMaxLessonsPerDayLimit\" <= 8");

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroupSchedulingPreferences_ClassGroupId",
                table: "ClassGroupSchedulingPreferences",
                column: "ClassGroupId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassGroupSchedulingPreferences");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_ClassGroupMaxConsecutiveL~",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_ClassGroupMaxLessonsPerDa~",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "ClassGroupAvoidSingleLessonDay",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "ClassGroupMaxConsecutiveLessons",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "ClassGroupMaxConsecutiveLessonsLimit",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "ClassGroupMaxLessonsPerDay",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "ClassGroupMaxLessonsPerDayLimit",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "ClassGroupMinimizeGaps",
                table: "OrganizationSchedulingPreferences");
        }
    }
}
