using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class InventoryAndApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "approval_requests",
                columns: table => new
                {
                    IdApprovalRequest = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    ApprovalTypeCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ModuleName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    ReferenceNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Title = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    DecidedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    DecidedDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DecisionNote = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_requests", x => x.IdApprovalRequest);
                    table.ForeignKey(
                        name: "FK_approval_requests_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_approval_requests_users_DecidedById",
                        column: x => x.DecidedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "goods_receivings",
                columns: table => new
                {
                    IdGoodsReceiving = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    ReceivingNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IdWarehouse = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdSupplier = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    ReceivingDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Note = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    TotalItem = table.Column<int>(type: "integer", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goods_receivings", x => x.IdGoodsReceiving);
                    table.ForeignKey(
                        name: "FK_goods_receivings_suppliers_IdSupplier",
                        column: x => x.IdSupplier,
                        principalTable: "suppliers",
                        principalColumn: "IdSupplier",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_goods_receivings_warehouses_IdWarehouse",
                        column: x => x.IdWarehouse,
                        principalTable: "warehouses",
                        principalColumn: "IdWarehouse",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inventories",
                columns: table => new
                {
                    IdInventory = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdWarehouse = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventories", x => x.IdInventory);
                    table.ForeignKey(
                        name: "FK_inventories_products_IdProduct",
                        column: x => x.IdProduct,
                        principalTable: "products",
                        principalColumn: "IdProduct",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inventories_warehouses_IdWarehouse",
                        column: x => x.IdWarehouse,
                        principalTable: "warehouses",
                        principalColumn: "IdWarehouse",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stock_movements",
                columns: table => new
                {
                    IdStockMovement = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdWarehouse = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    MovementType = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    QuantityBefore = table.Column<int>(type: "integer", nullable: false),
                    QuantityAfter = table.Column<int>(type: "integer", nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    ReferenceNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Note = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_movements", x => x.IdStockMovement);
                    table.ForeignKey(
                        name: "FK_stock_movements_products_IdProduct",
                        column: x => x.IdProduct,
                        principalTable: "products",
                        principalColumn: "IdProduct",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stock_movements_warehouses_IdWarehouse",
                        column: x => x.IdWarehouse,
                        principalTable: "warehouses",
                        principalColumn: "IdWarehouse",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stock_opnames",
                columns: table => new
                {
                    IdStockOpname = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    OpnameNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IdWarehouse = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    OpnameDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Note = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    TotalItem = table.Column<int>(type: "integer", nullable: false),
                    TotalDifference = table.Column<int>(type: "integer", nullable: false),
                    DateModified = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModifiedById = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_opnames", x => x.IdStockOpname);
                    table.ForeignKey(
                        name: "FK_stock_opnames_warehouses_IdWarehouse",
                        column: x => x.IdWarehouse,
                        principalTable: "warehouses",
                        principalColumn: "IdWarehouse",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "goods_receiving_details",
                columns: table => new
                {
                    IdGoodsReceivingDetail = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdGoodsReceiving = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    CostPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goods_receiving_details", x => x.IdGoodsReceivingDetail);
                    table.ForeignKey(
                        name: "FK_goods_receiving_details_goods_receivings_IdGoodsReceiving",
                        column: x => x.IdGoodsReceiving,
                        principalTable: "goods_receivings",
                        principalColumn: "IdGoodsReceiving",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_goods_receiving_details_products_IdProduct",
                        column: x => x.IdProduct,
                        principalTable: "products",
                        principalColumn: "IdProduct",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stock_opname_details",
                columns: table => new
                {
                    IdStockOpnameDetail = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdStockOpname = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    IdProduct = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    SystemStock = table.Column<int>(type: "integer", nullable: false),
                    PhysicalStock = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_opname_details", x => x.IdStockOpnameDetail);
                    table.ForeignKey(
                        name: "FK_stock_opname_details_products_IdProduct",
                        column: x => x.IdProduct,
                        principalTable: "products",
                        principalColumn: "IdProduct",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stock_opname_details_stock_opnames_IdStockOpname",
                        column: x => x.IdStockOpname,
                        principalTable: "stock_opnames",
                        principalColumn: "IdStockOpname",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_ApprovalTypeCode_ReferenceId",
                table: "approval_requests",
                columns: new[] { "ApprovalTypeCode", "ReferenceId" },
                unique: true,
                filter: "\"Status\" = 2");

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_CreatedById",
                table: "approval_requests",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_DecidedById",
                table: "approval_requests",
                column: "DecidedById");

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_Status",
                table: "approval_requests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receiving_details_IdGoodsReceiving",
                table: "goods_receiving_details",
                column: "IdGoodsReceiving");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receiving_details_IdProduct",
                table: "goods_receiving_details",
                column: "IdProduct");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receivings_IdSupplier",
                table: "goods_receivings",
                column: "IdSupplier");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receivings_IdWarehouse",
                table: "goods_receivings",
                column: "IdWarehouse");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receivings_ReceivingNumber",
                table: "goods_receivings",
                column: "ReceivingNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_goods_receivings_Status",
                table: "goods_receivings",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_inventories_IdProduct_IdWarehouse",
                table: "inventories",
                columns: new[] { "IdProduct", "IdWarehouse" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventories_IdWarehouse",
                table: "inventories",
                column: "IdWarehouse");

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_IdProduct_DateCreated",
                table: "stock_movements",
                columns: new[] { "IdProduct", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_IdWarehouse",
                table: "stock_movements",
                column: "IdWarehouse");

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_ReferenceType_ReferenceId",
                table: "stock_movements",
                columns: new[] { "ReferenceType", "ReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_stock_opname_details_IdProduct",
                table: "stock_opname_details",
                column: "IdProduct");

            migrationBuilder.CreateIndex(
                name: "IX_stock_opname_details_IdStockOpname",
                table: "stock_opname_details",
                column: "IdStockOpname");

            migrationBuilder.CreateIndex(
                name: "IX_stock_opnames_IdWarehouse",
                table: "stock_opnames",
                column: "IdWarehouse");

            migrationBuilder.CreateIndex(
                name: "IX_stock_opnames_OpnameNumber",
                table: "stock_opnames",
                column: "OpnameNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_opnames_Status",
                table: "stock_opnames",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "approval_requests");

            migrationBuilder.DropTable(
                name: "goods_receiving_details");

            migrationBuilder.DropTable(
                name: "inventories");

            migrationBuilder.DropTable(
                name: "stock_movements");

            migrationBuilder.DropTable(
                name: "stock_opname_details");

            migrationBuilder.DropTable(
                name: "goods_receivings");

            migrationBuilder.DropTable(
                name: "stock_opnames");
        }
    }
}
