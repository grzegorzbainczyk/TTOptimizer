using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectPreferredRoom : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PreferredRoomId",
                table: "SubjectSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreferredRoomImportance",
                table: "SubjectSchedulingPreferences",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubjectSchedulingPreferences_PreferredRoomId",
                table: "SubjectSchedulingPreferences",
                column: "PreferredRoomId");

            migrationBuilder.AddForeignKey(
                name: "FK_SubjectSchedulingPreferences_Rooms_PreferredRoomId",
                table: "SubjectSchedulingPreferences",
                column: "PreferredRoomId",
                principalTable: "Rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SubjectSchedulingPreferences_Rooms_PreferredRoomId",
                table: "SubjectSchedulingPreferences");

            migrationBuilder.DropIndex(
                name: "IX_SubjectSchedulingPreferences_PreferredRoomId",
                table: "SubjectSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "PreferredRoomId",
                table: "SubjectSchedulingPreferences");

            migrationBuilder.DropColumn(
                name: "PreferredRoomImportance",
                table: "SubjectSchedulingPreferences");
        }
    }
}
