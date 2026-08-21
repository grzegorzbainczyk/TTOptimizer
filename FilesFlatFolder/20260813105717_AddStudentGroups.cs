using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonRequirements_ClassGroups_ClassGroupId",
                table: "LessonRequirements");

            migrationBuilder.AlterColumn<int>(
                name: "ClassGroupId",
                table: "LessonRequirements",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "StudentGroupId",
                table: "LessonRequirements",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StudentGroupDivisions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<int>(type: "integer", nullable: false),
                    ClassGroupId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentGroupDivisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentGroupDivisions_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentGroupDivisions_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ClassGroupId = table.Column<int>(type: "integer", nullable: true),
                    DivisionId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentGroups_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentGroups_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentGroups_StudentGroupDivisions_DivisionId",
                        column: x => x.DivisionId,
                        principalTable: "StudentGroupDivisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentGroupMembers",
                columns: table => new
                {
                    StudentGroupId = table.Column<int>(type: "integer", nullable: false),
                    MemberGroupId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentGroupMembers", x => new { x.StudentGroupId, x.MemberGroupId });
                    table.ForeignKey(
                        name: "FK_StudentGroupMembers_StudentGroups_MemberGroupId",
                        column: x => x.MemberGroupId,
                        principalTable: "StudentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentGroupMembers_StudentGroups_StudentGroupId",
                        column: x => x.StudentGroupId,
                        principalTable: "StudentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LessonRequirements_StudentGroupId",
                table: "LessonRequirements",
                column: "StudentGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroupDivisions_ClassGroupId_Name",
                table: "StudentGroupDivisions",
                columns: new[] { "ClassGroupId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroupDivisions_OrganizationId",
                table: "StudentGroupDivisions",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroupMembers_MemberGroupId",
                table: "StudentGroupMembers",
                column: "MemberGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroups_ClassGroupId",
                table: "StudentGroups",
                column: "ClassGroupId",
                unique: true,
                filter: "\"Type\" = 0");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroups_DivisionId",
                table: "StudentGroups",
                column: "DivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroups_OrganizationId_Name",
                table: "StudentGroups",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LessonRequirements_ClassGroups_ClassGroupId",
                table: "LessonRequirements",
                column: "ClassGroupId",
                principalTable: "ClassGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LessonRequirements_StudentGroups_StudentGroupId",
                table: "LessonRequirements",
                column: "StudentGroupId",
                principalTable: "StudentGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonRequirements_ClassGroups_ClassGroupId",
                table: "LessonRequirements");

            migrationBuilder.DropForeignKey(
                name: "FK_LessonRequirements_StudentGroups_StudentGroupId",
                table: "LessonRequirements");

            migrationBuilder.DropTable(
                name: "StudentGroupMembers");

            migrationBuilder.DropTable(
                name: "StudentGroups");

            migrationBuilder.DropTable(
                name: "StudentGroupDivisions");

            migrationBuilder.DropIndex(
                name: "IX_LessonRequirements_StudentGroupId",
                table: "LessonRequirements");

            migrationBuilder.DropColumn(
                name: "StudentGroupId",
                table: "LessonRequirements");

            migrationBuilder.AlterColumn<int>(
                name: "ClassGroupId",
                table: "LessonRequirements",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LessonRequirements_ClassGroups_ClassGroupId",
                table: "LessonRequirements",
                column: "ClassGroupId",
                principalTable: "ClassGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
