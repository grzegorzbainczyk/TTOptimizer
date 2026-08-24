using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomSubjectConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rooms_OrganizationId",
                table: "Rooms");

            migrationBuilder.AddColumn<string>(
                name: "Info",
                table: "Rooms",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreferredSubjectId",
                table: "Rooms",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestrictedToSubjectId",
                table: "Rooms",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_OrganizationId_Name",
                table: "Rooms",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_PreferredSubjectId",
                table: "Rooms",
                column: "PreferredSubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_RestrictedToSubjectId",
                table: "Rooms",
                column: "RestrictedToSubjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Rooms_Subjects_PreferredSubjectId",
                table: "Rooms",
                column: "PreferredSubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Rooms_Subjects_RestrictedToSubjectId",
                table: "Rooms",
                column: "RestrictedToSubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rooms_Subjects_PreferredSubjectId",
                table: "Rooms");

            migrationBuilder.DropForeignKey(
                name: "FK_Rooms_Subjects_RestrictedToSubjectId",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_OrganizationId_Name",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_PreferredSubjectId",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_RestrictedToSubjectId",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "Info",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "PreferredSubjectId",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "RestrictedToSubjectId",
                table: "Rooms");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_OrganizationId",
                table: "Rooms",
                column: "OrganizationId");
        }
    }
}
