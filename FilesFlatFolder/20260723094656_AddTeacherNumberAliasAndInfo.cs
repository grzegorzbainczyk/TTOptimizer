using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherNumberAliasAndInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Alias",
                table: "Teachers",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Info",
                table: "Teachers",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeacherNumber",
                table: "Teachers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
        WITH numbered_teachers AS
        (
            SELECT
                "Id",
                ROW_NUMBER() OVER
                (
                    PARTITION BY "OrganizationId"
                    ORDER BY "Id"
                ) AS teacher_number
            FROM "Teachers"
        )
        UPDATE "Teachers" AS teacher
        SET
            "TeacherNumber" = numbered.teacher_number,
            "Alias" = 'T' || numbered.teacher_number
        FROM numbered_teachers AS numbered
        WHERE teacher."Id" = numbered."Id";
        """);

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_OrganizationId_Alias",
                table: "Teachers",
                columns: new[] { "OrganizationId", "Alias" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_OrganizationId_TeacherNumber",
                table: "Teachers",
                columns: new[] { "OrganizationId", "TeacherNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Teachers_OrganizationId_Alias",
                table: "Teachers");

            migrationBuilder.DropIndex(
                name: "IX_Teachers_OrganizationId_TeacherNumber",
                table: "Teachers");

            migrationBuilder.DropColumn(
                name: "Alias",
                table: "Teachers");

            migrationBuilder.DropColumn(
                name: "Info",
                table: "Teachers");

            migrationBuilder.DropColumn(
                name: "TeacherNumber",
                table: "Teachers");

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_OrganizationId",
                table: "Teachers",
                column: "OrganizationId");
        }
    }
}
