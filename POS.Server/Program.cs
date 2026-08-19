using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Serialization;
using POS.DataLayer.Services;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Middleware;
using POS.Server.Services;

var builder = WebApplication.CreateBuilder(args);

AppSettings.Initialize(builder.Configuration);

// Format tanggal dan angka mengikuti kebiasaan Indonesia pada seluruh proses server.
CultureInfo culture = new(DataLayerSettings.CultureName);
CultureInfo.DefaultThreadCurrentCulture = culture;
CultureInfo.DefaultThreadCurrentUICulture = culture;

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
        options.User.RequireUniqueEmail = false;
        options.Lockout.MaxFailedAccessAttempts = 10;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = AppSettings.JwtIssuer,
            ValidAudience = AppSettings.JwtAudience,
            IssuerSigningKey = TokenMethods.GetSigningKey(),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });

// Endpoint tertutup secara bawaan. Controller baru yang lupa diberi [Authorize] akan
// menolak permintaan, bukan menerimanya; yang boleh terbuka harus menyebutkannya sendiri
// lewat [AllowAnonymous] (PRD bagian 46).
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

// Pembatasan laju hanya dipasang pada endpoint masuk. Di situlah percobaan menebak
// kata sandi terjadi, dan di situ pula satu permintaan berarti satu pemeriksaan hash
// yang mahal. Endpoint lain sudah dilindungi token (PRD bagian 46).
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy(AppData.RateLimitPolicyLogin, context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync(
            "Terlalu banyak percobaan masuk dari perangkat ini. Tunggu satu menit lalu coba lagi.",
            cancellationToken);
    };
});

// Kontrak JSON memakai PascalCase agar nama properti sama persis antara model C# dan TypeScript.
builder.Services.AddControllers()
    .AddNewtonsoftJson(options => options.SerializerSettings.ContractResolver = new DefaultContractResolver())
    .ConfigureApiBehaviorOptions(options => options.SuppressModelStateInvalidFilter = true);

builder.Services.AddOpenApi();

if (AppSettings.AllowedOrigins.Length > 0)
{
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
        .WithOrigins(AppSettings.AllowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));
}

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseDefaultFiles();
app.MapStaticAssets().AllowAnonymous();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseHttpsRedirection();

if (AppSettings.AllowedOrigins.Length > 0)
{
    app.UseCors();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html").AllowAnonymous();

await DbInitializer.SeedAsync(app.Services, app.Configuration);

app.Run();
