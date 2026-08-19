using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class MemberAndLoyalty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdMember",
                table: "transactions",
                type: "character varying(36)",
                maxLength: 36,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PointEarned",
                table: "transactions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PointRedeemed",
                table: "transactions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "members",
                columns: table => new
                {
                    IdMember = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MemberName = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: false),
                    Email = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Address = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    PointBalance = table.Column<int>(type: "integer", nullable: false),
                    TotalSpending = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalTransaction = table.Column<int>(type: "integer", nullable: false),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_members", x => x.IdMember);
                });

            migrationBuilder.CreateTable(
                name: "point_redemption_rules",
                columns: table => new
                {
                    IdPointRedemptionRule = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    RuleName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PointRequired = table.Column<int>(type: "integer", nullable: false),
                    DiscountValueType = table.Column<int>(type: "integer", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MaximumDiscount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumPurchase = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_point_redemption_rules", x => x.IdPointRedemptionRule);
                });

            migrationBuilder.CreateTable(
                name: "member_point_transactions",
                columns: table => new
                {
                    IdMemberPointTransaction = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdMember = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    MovementType = table.Column<int>(type: "integer", nullable: false),
                    Point = table.Column<int>(type: "integer", nullable: false),
                    PointBefore = table.Column<int>(type: "integer", nullable: false),
                    PointAfter = table.Column<int>(type: "integer", nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    ReferenceNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Note = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_point_transactions", x => x.IdMemberPointTransaction);
                    table.ForeignKey(
                        name: "FK_member_point_transactions_members_IdMember",
                        column: x => x.IdMember,
                        principalTable: "members",
                        principalColumn: "IdMember",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transactions_IdMember",
                table: "transactions",
                column: "IdMember");

            migrationBuilder.CreateIndex(
                name: "IX_member_point_transactions_IdMember_DateCreated",
                table: "member_point_transactions",
                columns: new[] { "IdMember", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_members_MemberName",
                table: "members",
                column: "MemberName");

            migrationBuilder.CreateIndex(
                name: "IX_members_PhoneNumber",
                table: "members",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_point_redemption_rules_PointRequired",
                table: "point_redemption_rules",
                column: "PointRequired");

            migrationBuilder.AddForeignKey(
                name: "FK_transactions_members_IdMember",
                table: "transactions",
                column: "IdMember",
                principalTable: "members",
                principalColumn: "IdMember",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_transactions_members_IdMember",
                table: "transactions");

            migrationBuilder.DropTable(
                name: "member_point_transactions");

            migrationBuilder.DropTable(
                name: "point_redemption_rules");

            migrationBuilder.DropTable(
                name: "members");

            migrationBuilder.DropIndex(
                name: "IX_transactions_IdMember",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "IdMember",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "PointEarned",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "PointRedeemed",
                table: "transactions");
        }
    }
}
