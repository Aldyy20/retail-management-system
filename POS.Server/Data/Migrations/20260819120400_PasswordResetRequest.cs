using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class PasswordResetRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "password_reset_requests",
                columns: table => new
                {
                    IdPasswordResetRequest = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdUser = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Note = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    HandledById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    HandledDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    HandledNote = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_requests", x => x.IdPasswordResetRequest);
                    table.ForeignKey(
                        name: "FK_password_reset_requests_users_HandledById",
                        column: x => x.HandledById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_password_reset_requests_users_IdUser",
                        column: x => x.IdUser,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_requests_HandledById",
                table: "password_reset_requests",
                column: "HandledById");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_requests_IdUser",
                table: "password_reset_requests",
                column: "IdUser",
                unique: true,
                filter: "\"Status\" = 2");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_requests_Status",
                table: "password_reset_requests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "password_reset_requests");
        }
    }
}
