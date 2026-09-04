using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TTOptimizer.Web.Data;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260904120000_AddLessonRequirementPreferredRoom")]
    public partial class AddLessonRequirementPreferredRoom : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PreferredRoomId",
                table: "LessonRequirements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreferredRoomImportance",
                table: "LessonRequirements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_LessonRequirements_PreferredRoomId",
                table: "LessonRequirements",
                column: "PreferredRoomId");

            migrationBuilder.AddForeignKey(
                name: "FK_LessonRequirements_Rooms_PreferredRoomId",
                table: "LessonRequirements",
                column: "PreferredRoomId",
                principalTable: "Rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonRequirements_Rooms_PreferredRoomId",
                table: "LessonRequirements");
            migrationBuilder.DropIndex(
                name: "IX_LessonRequirements_PreferredRoomId",
                table: "LessonRequirements");
            migrationBuilder.DropColumn(
                name: "PreferredRoomId",
                table: "LessonRequirements");
            migrationBuilder.DropColumn(
                name: "PreferredRoomImportance",
                table: "LessonRequirements");
        }
    }
}
