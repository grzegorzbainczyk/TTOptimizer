using TTOptimizer.Web.Services;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<DemoDataSeeder>();
builder.Services.AddScoped<CppOptimizerService>();
builder.Services.AddScoped<TimetableProblemBuilder>();
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