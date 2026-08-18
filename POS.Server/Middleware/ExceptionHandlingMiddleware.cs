using System.Text.Json;

namespace POS.Server.Middleware;

/// <summary>
/// Menangkap kesalahan yang tidak tertangani agar frontend selalu menerima pesan
/// yang dapat ditampilkan, dan detail teknis hanya masuk ke log server.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kesalahan tidak tertangani pada {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(
                "Terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi admin."));
        }
    }
}
