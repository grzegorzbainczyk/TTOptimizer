using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class IntroduceSchoolUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create SchoolUnits while Organizations.SchoolType still exists,
            //    because we need the old value to seed the new rows.
            migrationBuilder.CreateTable(
                name: "SchoolUnits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<int>(
                        type: "integer",
                        nullable: false),
                    Name = table.Column<string>(
                        type: "character varying(200)",
                        maxLength: 200,
                        nullable: false),
                    SchoolType = table.Column<int>(
                        type: "integer",
                        nullable: false,
                        defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchoolUnits", x => x.Id);

                    table.ForeignKey(
                        name: "FK_SchoolUnits_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SchoolUnits_OrganizationId_Name",
                table: "SchoolUnits",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            // 2. Create one SchoolUnit for every existing Organization.
            //    Preserve the old Organization.SchoolType value.
            migrationBuilder.Sql(
                """
                INSERT INTO "SchoolUnits" ("OrganizationId", "Name", "SchoolType")
                SELECT
                    "Id",
                    "Name",
                    "SchoolType"
                FROM "Organizations";
                """);

            // 3. Add SchoolUnitId temporarily as nullable.
            //    Existing ClassGroups cannot point to a SchoolUnit before
            //    the SchoolUnit rows have been created.
            migrationBuilder.AddColumn<int>(
                name: "SchoolUnitId",
                table: "ClassGroups",
                type: "integer",
                nullable: true);

            // 4. Assign every existing ClassGroup to the SchoolUnit created
            //    for its Organization.
            migrationBuilder.Sql(
                """
                UPDATE "ClassGroups" AS cg
                SET "SchoolUnitId" = su."Id"
                FROM "SchoolUnits" AS su
                WHERE su."OrganizationId" = cg."OrganizationId";
                """);

            // 5. SchoolUnitId is required in the final model.
            migrationBuilder.AlterColumn<int>(
                name: "SchoolUnitId",
                table: "ClassGroups",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroups_SchoolUnitId",
                table: "ClassGroups",
                column: "SchoolUnitId");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassGroups_SchoolUnits_SchoolUnitId",
                table: "ClassGroups",
                column: "SchoolUnitId",
                principalTable: "SchoolUnits",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 6. Only now is the old Organization.SchoolType no longer needed.
            migrationBuilder.DropColumn(
                name: "SchoolType",
                table: "Organizations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore the old column before removing SchoolUnits.
            migrationBuilder.AddColumn<int>(
                name: "SchoolType",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // If a user created multiple SchoolUnits after this migration,
            // the old model cannot represent them. For rollback, preserve the
            // SchoolType of the first SchoolUnit belonging to each Organization.
            migrationBuilder.Sql(
                """
                UPDATE "Organizations" AS o
                SET "SchoolType" = source."SchoolType"
                FROM (
                    SELECT DISTINCT ON ("OrganizationId")
                        "OrganizationId",
                        "SchoolType"
                    FROM "SchoolUnits"
                    ORDER BY "OrganizationId", "Id"
                ) AS source
                WHERE source."OrganizationId" = o."Id";
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_ClassGroups_SchoolUnits_SchoolUnitId",
                table: "ClassGroups");

            migrationBuilder.DropIndex(
                name: "IX_ClassGroups_SchoolUnitId",
                table: "ClassGroups");

            migrationBuilder.DropColumn(
                name: "SchoolUnitId",
                table: "ClassGroups");

            migrationBuilder.DropTable(
                name: "SchoolUnits");
        }
    }
}