using TTOptimizer.Web.Services;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<CppOptimizerService>();
builder.Services.AddScoped<TestProblemFactory>();
builder.Services.AddScoped<ScheduleSlotGeneratorService>();
builder.Services.AddScoped<LessonInstanceGeneratorService>();
builder.Services.AddScoped<TimetableDecoderService>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

await DatabaseSeeder.SeedDemoDataAsync(app.Services);

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();

app.Run();