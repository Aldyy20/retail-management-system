using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AuditLogActionIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_ActionName",
                table: "audit_logs",
                column: "ActionName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_audit_logs_ActionName",
                table: "audit_logs");
        }
    }
}
