using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TTOptimizer.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeSlotPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassGroupUnavailabilities");

            migrationBuilder.DropTable(
                name: "RoomUnavailabilities");

            migrationBuilder.DropTable(
                name: "TeacherUnavailabilities");

            migrationBuilder.CreateTable(
                name: "ClassGroupTimeSlotPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClassGroupId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false),
                    PreferenceType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassGroupTimeSlotPreferences", x => x.Id);
                    table.CheckConstraint("CK_ClassGroupTimeSlotPreference_DayIndex", "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");
                    table.CheckConstraint("CK_ClassGroupTimeSlotPreference_SlotIndex", "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                    table.ForeignKey(
                        name: "FK_ClassGroupTimeSlotPreferences_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomTimeSlotPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoomId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false),
                    PreferenceType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomTimeSlotPreferences", x => x.Id);
                    table.CheckConstraint("CK_RoomTimeSlotPreference_DayIndex", "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");
                    table.CheckConstraint("CK_RoomTimeSlotPreference_SlotIndex", "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                    table.ForeignKey(
                        name: "FK_RoomTimeSlotPreferences_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubjectTimeSlotPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubjectId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false),
                    PreferenceType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubjectTimeSlotPreferences", x => x.Id);
                    table.CheckConstraint("CK_SubjectTimeSlotPreference_DayIndex", "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");
                    table.CheckConstraint("CK_SubjectTimeSlotPreference_SlotIndex", "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                    table.ForeignKey(
                        name: "FK_SubjectTimeSlotPreferences_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TeacherTimeSlotPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeacherId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false),
                    PreferenceType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherTimeSlotPreferences", x => x.Id);
                    table.CheckConstraint("CK_TeacherTimeSlotPreference_DayIndex", "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");
                    table.CheckConstraint("CK_TeacherTimeSlotPreference_SlotIndex", "\"SlotIndex\" >= 0 AND \"SlotIndex\" <= 7");
                    table.ForeignKey(
                        name: "FK_TeacherTimeSlotPreferences_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroupTimeSlotPreferences_ClassGroupId_DayIndex_SlotInd~",
                table: "ClassGroupTimeSlotPreferences",
                columns: new[] { "ClassGroupId", "DayIndex", "SlotIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomTimeSlotPreferences_RoomId_DayIndex_SlotIndex",
                table: "RoomTimeSlotPreferences",
                columns: new[] { "RoomId", "DayIndex", "SlotIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubjectTimeSlotPreferences_SubjectId_DayIndex_SlotIndex",
                table: "SubjectTimeSlotPreferences",
                columns: new[] { "SubjectId", "DayIndex", "SlotIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherTimeSlotPreferences_TeacherId_DayIndex_SlotIndex",
                table: "TeacherTimeSlotPreferences",
                columns: new[] { "TeacherId", "DayIndex", "SlotIndex" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassGroupTimeSlotPreferences");

            migrationBuilder.DropTable(
                name: "RoomTimeSlotPreferences");

            migrationBuilder.DropTable(
                name: "SubjectTimeSlotPreferences");

            migrationBuilder.DropTable(
                name: "TeacherTimeSlotPreferences");

            migrationBuilder.CreateTable(
                name: "ClassGroupUnavailabilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClassGroupId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassGroupUnavailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassGroupUnavailabilities_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomUnavailabilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoomId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomUnavailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomUnavailabilities_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TeacherUnavailabilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeacherId = table.Column<int>(type: "integer", nullable: false),
                    DayIndex = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherUnavailabilities", x => x.Id);
                    table.CheckConstraint("CK_TeacherUnavailability_DayIndex", "\"DayIndex\" >= 0 AND \"DayIndex\" <= 4");
                    table.ForeignKey(
                        name: "FK_TeacherUnavailabilities_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroupUnavailabilities_ClassGroupId_DayIndex_SlotIndex",
                table: "ClassGroupUnavailabilities",
                columns: new[] { "ClassGroupId", "DayIndex", "SlotIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomUnavailabilities_RoomId_DayIndex_SlotIndex",
                table: "RoomUnavailabilities",
                columns: new[] { "RoomId", "DayIndex", "SlotIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherUnavailabilities_TeacherId_DayIndex_SlotIndex",
                table: "TeacherUnavailabilities",
                columns: new[] { "TeacherId", "DayIndex", "SlotIndex" },
                unique: true);
        }
    }
}
