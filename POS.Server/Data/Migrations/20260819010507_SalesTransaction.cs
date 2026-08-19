using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class SalesTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "payment_methods",
                columns: table => new
                {
                    PaymentMethodCode = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    PaymentMethodName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    RequiresChange = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_methods", x => x.PaymentMethodCode);
                });

            migrationBuilder.CreateTable(
                name: "transactions",
                columns: table => new
                {
                    IdTransaction = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    InvoiceNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IdWarehouse = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    SubtotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    VoucherDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PointDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethodCode = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ChangeAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    TotalItem = table.Column<int>(type: "integer", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transactions", x => x.IdTransaction);
                    table.ForeignKey(
                        name: "FK_transactions_payment_methods_PaymentMethodCode",
                        column: x => x.PaymentMethodCode,
                        principalTable: "payment_methods",
                        principalColumn: "PaymentMethodCode",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transactions_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transactions_warehouses_IdWarehouse",
                        column: x => x.IdWarehouse,
                        principalTable: "warehouses",
                        principalColumn: "IdWarehouse",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "transaction_details",
                columns: table => new
                {
                    IdTransactionDetail = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdTransaction = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    Sku = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProductName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UnitName = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CostPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transaction_details", x => x.IdTransactionDetail);
                    table.ForeignKey(
                        name: "FK_transaction_details_products_IdProduct",
                        column: x => x.IdProduct,
                        principalTable: "products",
                        principalColumn: "IdProduct",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transaction_details_transactions_IdTransaction",
                        column: x => x.IdTransaction,
                        principalTable: "transactions",
                        principalColumn: "IdTransaction",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transaction_details_IdProduct",
                table: "transaction_details",
                column: "IdProduct");

            migrationBuilder.CreateIndex(
                name: "IX_transaction_details_IdTransaction",
                table: "transaction_details",
                column: "IdTransaction");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_CreatedById",
                table: "transactions",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_IdWarehouse",
                table: "transactions",
                column: "IdWarehouse");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_InvoiceNumber",
                table: "transactions",
                column: "InvoiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transactions_PaymentMethodCode",
                table: "transactions",
                column: "PaymentMethodCode");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_Status",
                table: "transactions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_TransactionDate",
                table: "transactions",
                column: "TransactionDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "transaction_details");

            migrationBuilder.DropTable(
                name: "transactions");

            migrationBuilder.DropTable(
                name: "payment_methods");
        }
    }
}
