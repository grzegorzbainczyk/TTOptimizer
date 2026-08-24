using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectSchedulingRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SubjectAvoidDoubleLessons",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SubjectMaxOccurrencesPerDay",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "SubjectMaxOccurrencesPerDayLimit",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "SubjectPreferDoubleLessons",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SubjectSpreadAcrossDays",
                table: "OrganizationSchedulingPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.CreateTable(
                name: "SubjectSchedulingPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubjectId = table.Column<int>(type: "integer", nullable: false),
                    SpreadAcrossDays = table.Column<int>(type: "integer", nullable: true),
                    MaxOccurrencesPerDay = table.Column<int>(type: "integer", nullable: true),
                    MaxOccurrencesPerDayLimit = table.Column<int>(type: "integer", nullable: true),
                    PreferDoubleLessons = table.Column<int>(type: "integer", nullable: true),
                    AvoidDoubleLessons = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubjectSchedulingPreferences", x => x.Id);
                    table.CheckConstraint("CK_SubjectSchedulingPreferences_MaxOccurrencesPerDayLimit", "\"MaxOccurrencesPerDayLimit\" IS NULL OR (\"MaxOccurrencesPerDayLimit\" >= 1 AND \"MaxOccurrencesPerDayLimit\" <= 8)");
                    table.ForeignKey(
                        name: "FK_SubjectSchedulingPreferences_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_SubjectMaxOccurrencesPerD~",
                table: "OrganizationSchedulingPreferences",
                sql: "\"SubjectMaxOccurrencesPerDayLimit\" >= 1 AND \"SubjectMaxOccurrencesPerDayLimit\" <= 8");

            migrationBuilder.CreateIndex(
                name: "IX_SubjectSchedulingPreferences_SubjectId",
                table: "SubjectSchedulingPreferences",
                column: "SubjectId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubjectSchedulingPreferences");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrganizationSchedulingPreferences_SubjectMaxOccurrencesPerD~",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "SubjectAvoidDoubleLessons",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "SubjectMaxOccurrencesPerDay",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "SubjectMaxOccurrencesPerDayLimit",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "SubjectPreferDoubleLessons",
                table: "OrganizationSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "SubjectSpreadAcrossDays",
                table: "OrganizationSchedulingPreferences");
        }
    }
}
