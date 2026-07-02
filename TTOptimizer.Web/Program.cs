using TTOptimizer.Web.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<CppOptimizerService>();
builder.Services.AddScoped<TestProblemFactory>();
builder.Services.AddScoped<ScheduleSlotGeneratorService>();
builder.Services.AddScoped<LessonInstanceGeneratorService>();
builder.Services.AddScoped<TimetableDecoderService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();

app.Run();