public class ValidationResult
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public static ValidationResult Ok()
    {
        return new ValidationResult
        {
            Success = true,
            Message = string.Empty
        };
    }

    public static ValidationResult Fail(string message)
    {
        return new ValidationResult
        {
            Success = false,
            Message = message
        };
    }
}