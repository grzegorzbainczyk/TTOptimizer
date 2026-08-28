using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TTOptimizer.Web.Data;
using TTOptimizer.Web.Models.Domain;
using TTOptimizer.Web.Models.DTO.Auth;

namespace TTOptimizer.Web.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<AppUser> _passwordHasher;

    public AuthController(
        AppDbContext db,
        IPasswordHasher<AppUser> passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? string.Empty;
        var organizationName =
            request.OrganizationName?.Trim() ?? string.Empty;

        if (!IsValidEmail(email))
        {
            return BadRequest(new
            {
                success = false,
                message = "Podaj poprawny adres e-mail."
            });
        }

        if (displayName.Length is < 2 or > 200)
        {
            return BadRequest(new
            {
                success = false,
                message = "Nazwa użytkownika musi mieć od 2 do 200 znaków."
            });
        }

        if (organizationName.Length is < 2 or > 200)
        {
            return BadRequest(new
            {
                success = false,
                message = "Nazwa organizacji musi mieć od 2 do 200 znaków."
            });
        }

        if (!IsValidPassword(request.Password))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Hasło musi mieć co najmniej 8 znaków i zawierać literę oraz cyfrę."
            });
        }

        var exists = await _db.AppUsers
            .AnyAsync(user => user.UserName == email);

        if (exists)
        {
            return Conflict(new
            {
                success = false,
                message = "Konto z tym adresem e-mail już istnieje."
            });
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            var user = new AppUser
            {
                UserName = email,
                DisplayName = displayName
            };

            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password);

            var organization = new Organization
            {
                Name = organizationName
            };

            _db.AppUsers.Add(user);
            _db.Organizations.Add(organization);

            await _db.SaveChangesAsync();

            _db.AppUserOrganizations.Add(
                new AppUserOrganization
                {
                    AppUserId = user.Id,
                    OrganizationId = organization.Id,
                    Role = "Owner"
                });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                success = true,
                userId = user.Id,
                userName = user.UserName,
                displayName = user.DisplayName,
                organizationId = organization.Id,
                organizationName = organization.Name,
                role = "Owner",
                isNewOrganization = true
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        var email = NormalizeEmail(request.Email);

        if (!IsValidEmail(email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Nieprawidłowy e-mail lub hasło."
            });
        }

        var user = await _db.AppUsers
            .Include(item => item.AppUserOrganizations)
                .ThenInclude(item => item.Organization)
            .FirstOrDefaultAsync(item =>
                item.UserName == email);

        if (user == null ||
            string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Nieprawidłowy e-mail lub hasło."
            });
        }

        var verification =
            _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Nieprawidłowy e-mail lub hasło."
            });
        }

        if (verification ==
            PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password);

            await _db.SaveChangesAsync();
        }

        var memberships = user.AppUserOrganizations
            .OrderByDescending(item =>
                item.Role == "Owner")
            .ThenBy(item => item.Organization.Name)
            .ToList();

        if (memberships.Count == 0)
        {
            return Conflict(new
            {
                success = false,
                message =
                    "Konto nie jest przypisane do żadnej organizacji."
            });
        }

        var selected = memberships[0];

        return Ok(new
        {
            success = true,
            userId = user.Id,
            userName = user.UserName,
            displayName = user.DisplayName,
            organizationId = selected.OrganizationId,
            organizationName = selected.Organization.Name,
            role = selected.Role,
            organizations = memberships.Select(item => new
            {
                id = item.OrganizationId,
                name = item.Organization.Name,
                role = item.Role
            })
        });
    }

    private static string NormalizeEmail(string? value)
    {
        return (value ?? string.Empty)
            .Trim()
            .ToLowerInvariant();
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) ||
            email.Length > 200)
        {
            return false;
        }

        try
        {
            var address =
                new System.Net.Mail.MailAddress(email);

            return string.Equals(
                address.Address,
                email,
                StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static bool IsValidPassword(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            password.Length < 8 ||
            password.Length > 200)
        {
            return false;
        }

        return password.Any(char.IsLetter) &&
               password.Any(char.IsDigit);
    }
}
