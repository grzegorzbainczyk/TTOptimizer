using Microsoft.AspNetCore.Identity;
using TTOptimizer.Web.Models.Domain;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Hubs;
using TTOptimizer.Web.Services;
using TTOptimizer.Web.Services.AI;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();

builder.Services.AddScoped<DemoDataSeeder>();
builder.Services.AddScoped<CppOptimizerService>();
builder.Services.AddScoped<TimetableProblemBuilderService>();
builder.Services.AddScoped<ScheduleSlotGeneratorService>();
builder.Services.AddScoped<LessonInstanceGeneratorService>();
builder.Services.AddScoped<TimetableDecoderService>();
builder.Services.AddScoped<ILLMService, LLMService>();
builder.Services.AddScoped<ILLMRuleInterpreterService, LLMRuleInterpreterService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<OptimizationHub>("/hubs/optimization");

app.Run();
