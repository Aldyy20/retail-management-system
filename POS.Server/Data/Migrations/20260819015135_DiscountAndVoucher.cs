using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class DiscountAndVoucher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdVoucher",
                table: "transactions",
                type: "character varying(36)",
                maxLength: 36,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VoucherCode",
                table: "transactions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "discounts",
                columns: table => new
                {
                    IdDiscount = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    DiscountName = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: false),
                    DiscountValueType = table.Column<int>(type: "integer", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MaximumDiscount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_discounts", x => x.IdDiscount);
                });

            migrationBuilder.CreateTable(
                name: "vouchers",
                columns: table => new
                {
                    IdVoucher = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    VoucherCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    VoucherName = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: false),
                    DiscountValueType = table.Column<int>(type: "integer", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumPurchase = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MaximumDiscount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UsageLimit = table.Column<int>(type: "integer", nullable: false),
                    IsMemberOnly = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vouchers", x => x.IdVoucher);
                });

            migrationBuilder.CreateTable(
                name: "discount_products",
                columns: table => new
                {
                    IdDiscountProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdDiscount = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_discount_products", x => x.IdDiscountProduct);
                    table.ForeignKey(
                        name: "FK_discount_products_discounts_IdDiscount",
                        column: x => x.IdDiscount,
                        principalTable: "discounts",
                        principalColumn: "IdDiscount",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_discount_products_products_IdProduct",
                        column: x => x.IdProduct,
                        principalTable: "products",
                        principalColumn: "IdProduct",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "voucher_usages",
                columns: table => new
                {
                    IdVoucherUsage = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdVoucher = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdTransaction = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdMember = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    DiscountAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_voucher_usages", x => x.IdVoucherUsage);
                    table.ForeignKey(
                        name: "FK_voucher_usages_transactions_IdTransaction",
                        column: x => x.IdTransaction,
                        principalTable: "transactions",
                        principalColumn: "IdTransaction",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_voucher_usages_vouchers_IdVoucher",
                        column: x => x.IdVoucher,
                        principalTable: "vouchers",
                        principalColumn: "IdVoucher",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_discount_products_IdDiscount_IdProduct",
                table: "discount_products",
                columns: new[] { "IdDiscount", "IdProduct" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_discount_products_IdProduct",
                table: "discount_products",
                column: "IdProduct");

            migrationBuilder.CreateIndex(
                name: "IX_discounts_IsActive_StartDate_EndDate",
                table: "discounts",
                columns: new[] { "IsActive", "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_voucher_usages_IdTransaction",
                table: "voucher_usages",
                column: "IdTransaction");

            migrationBuilder.CreateIndex(
                name: "IX_voucher_usages_IdVoucher",
                table: "voucher_usages",
                column: "IdVoucher");

            migrationBuilder.CreateIndex(
                name: "IX_vouchers_VoucherCode",
                table: "vouchers",
                column: "VoucherCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "discount_products");

            migrationBuilder.DropTable(
                name: "voucher_usages");

            migrationBuilder.DropTable(
                name: "discounts");

            migrationBuilder.DropTable(
                name: "vouchers");

            migrationBuilder.DropColumn(
                name: "IdVoucher",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "VoucherCode",
                table: "transactions");
        }
    }
}
