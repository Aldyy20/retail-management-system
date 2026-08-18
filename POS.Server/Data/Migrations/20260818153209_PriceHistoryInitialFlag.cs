using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class PriceHistoryInitialFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsInitialPrice",
                table: "price_histories",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsInitialPrice",
                table: "price_histories");
        }
    }
}
