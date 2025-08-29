using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Phos.DigestionScore.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "digestion_scores",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Score = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    AsOfDate = table.Column<DateTime>(type: "date", nullable: false),
                    ComputedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_digestion_scores", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_digestion_scores_UserId_AsOfDate",
                table: "digestion_scores",
                columns: new[] { "UserId", "AsOfDate" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "digestion_scores");
        }
    }
}


