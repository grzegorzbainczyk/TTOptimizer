using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddClassGroupDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ClassGroups_OrganizationId",
                table: "ClassGroups");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "ClassGroups",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<int>(
                name: "DefaultRoomId",
                table: "ClassGroups",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HomeroomTeacherId",
                table: "ClassGroups",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Info",
                table: "ClassGroups",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroups_DefaultRoomId",
                table: "ClassGroups",
                column: "DefaultRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroups_HomeroomTeacherId",
                table: "ClassGroups",
                column: "HomeroomTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroups_OrganizationId_Name",
                table: "ClassGroups",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ClassGroups_Rooms_DefaultRoomId",
                table: "ClassGroups",
                column: "DefaultRoomId",
                principalTable: "Rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ClassGroups_Teachers_HomeroomTeacherId",
                table: "ClassGroups",
                column: "HomeroomTeacherId",
                principalTable: "Teachers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassGroups_Rooms_DefaultRoomId",
                table: "ClassGroups");

            migrationBuilder.DropForeignKey(
                name: "FK_ClassGroups_Teachers_HomeroomTeacherId",
                table: "ClassGroups");

            migrationBuilder.DropIndex(
                name: "IX_ClassGroups_DefaultRoomId",
                table: "ClassGroups");

            migrationBuilder.DropIndex(
                name: "IX_ClassGroups_HomeroomTeacherId",
                table: "ClassGroups");

            migrationBuilder.DropIndex(
                name: "IX_ClassGroups_OrganizationId_Name",
                table: "ClassGroups");

            migrationBuilder.DropColumn(
                name: "DefaultRoomId",
                table: "ClassGroups");

            migrationBuilder.DropColumn(
                name: "HomeroomTeacherId",
                table: "ClassGroups");

            migrationBuilder.DropColumn(
                name: "Info",
                table: "ClassGroups");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "ClassGroups",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroups_OrganizationId",
                table: "ClassGroups",
                column: "OrganizationId");
        }
    }
}
