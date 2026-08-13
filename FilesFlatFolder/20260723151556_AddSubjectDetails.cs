using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Subjects_OrganizationId",
                table: "Subjects");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Subjects",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<string>(
                name: "Info",
                table: "Subjects",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_OrganizationId_Name",
                table: "Subjects",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Subjects_OrganizationId_Name",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "Info",
                table: "Subjects");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Subjects",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_OrganizationId",
                table: "Subjects",
                column: "OrganizationId");
        }
    }
}
