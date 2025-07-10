using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using GestorTareas.API.Models;
using GestorTareas.API.DTOs;
using GestorTareas.API.Data;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Net;

namespace GestorTareas.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDTO> RegistrarAsync(RegistroDTO registroDTO);
        Task<AuthResponseDTO> LoginAsync(LoginDTO loginDTO);
        Task<bool> RecuperarPasswordAsync(string email);
        Task<bool> ConfirmarEmailAsync(string token);
        Task<bool> EnviarEmailConfirmacionAsync(string email);
        Task<IEnumerable<UsuarioResponseDTO>> ObtenerTodosLosUsuariosAsync();
        Task<UsuarioResponseDTO> EditarPerfilAsync(int userId, EditarPerfilDTO editarDTO);
        Task<UsuarioResponseDTO> ObtenerUsuarioPorIdAsync(int userId);
        Task<bool> LogoutAsync(int userId);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
    }
    
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        
        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        
        public async Task<AuthResponseDTO> RegistrarAsync(RegistroDTO registroDTO)
        {
            // Verificar si el email ya existe
            if (await _context.Usuarios.AnyAsync(u => u.Email == registroDTO.Email))
            {
                throw new InvalidOperationException("El email ya está registrado");
            }
            
            // Crear hash y salt de la contraseña
            var (passwordHash, passwordSalt) = CrearPasswordHash(registroDTO.Password);
            
            // Generar token de confirmación de email
            var tokenConfirmacion = GenerarTokenSeguro();
            
            var usuario = new Usuario
            {
                Email = registroDTO.Email,
                Nombre = registroDTO.Nombre,
                Apellido = registroDTO.Apellido,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                TokenConfirmacionEmail = tokenConfirmacion,
                TokenConfirmacionEmailExpiracion = DateTime.UtcNow.AddDays(7)
            };
            
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            
            // Generar JWT
            var token = GenerarJWT(usuario);
            
            return new AuthResponseDTO
            {
                Token = token,
                Usuario = new UsuarioResponseDTO
                {
                    Id = usuario.Id,
                    Email = usuario.Email,
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    FechaCreacion = usuario.FechaCreacion,
                    EmailConfirmado = usuario.EmailConfirmado
                },
                Expiracion = DateTime.UtcNow.AddDays(7)
            };
        }
        
        public async Task<AuthResponseDTO> LoginAsync(LoginDTO loginDTO)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == loginDTO.Email);
            
            if (usuario == null || !VerificarPassword(loginDTO.Password, usuario.PasswordHash, usuario.PasswordSalt))
            {
                throw new InvalidOperationException("Email o contraseña incorrectos");
            }
            
            // Actualizar último acceso
            usuario.UltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            // Generar JWT
            var token = GenerarJWT(usuario);
            
            return new AuthResponseDTO
            {
                Token = token,
                Usuario = new UsuarioResponseDTO
                {
                    Id = usuario.Id,
                    Email = usuario.Email,
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    FechaCreacion = usuario.FechaCreacion,
                    EmailConfirmado = usuario.EmailConfirmado
                },
                Expiracion = DateTime.UtcNow.AddDays(7)
            };
        }
        
        public async Task<bool> RecuperarPasswordAsync(string email)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
            if (usuario == null)
            {
                // Por seguridad, no revelamos si el email existe o no
                return true;
            }
            // Generar token de recuperación
            var tokenRecuperacion = GenerarTokenSeguro();
            usuario.TokenRecuperacionPassword = tokenRecuperacion;
            usuario.TokenRecuperacionPasswordExpiracion = DateTime.UtcNow.AddHours(24);
            await _context.SaveChangesAsync();
            // Enviar email con el token
            EnviarEmailRecuperacion(usuario.Email, tokenRecuperacion);
            return true;
        }
        
        public async Task<bool> ConfirmarEmailAsync(string token)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => 
                u.TokenConfirmacionEmail == token && 
                u.TokenConfirmacionEmailExpiracion > DateTime.UtcNow);
            
            if (usuario == null)
            {
                return false;
            }
            
            usuario.EmailConfirmado = true;
            usuario.TokenConfirmacionEmail = null;
            usuario.TokenConfirmacionEmailExpiracion = null;
            
            await _context.SaveChangesAsync();
            return true;
        }
        
        public async Task<bool> EnviarEmailConfirmacionAsync(string email)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
            
            if (usuario == null || usuario.EmailConfirmado)
            {
                return false;
            }
            
            // Generar nuevo token
            var tokenConfirmacion = GenerarTokenSeguro();
            usuario.TokenConfirmacionEmail = tokenConfirmacion;
            usuario.TokenConfirmacionEmailExpiracion = DateTime.UtcNow.AddDays(7);
            
            await _context.SaveChangesAsync();
            
            // TODO: Enviar email con el token
            return true;
        }
        
        private (string hash, string salt) CrearPasswordHash(string password)
        {
            using var hmac = new HMACSHA512();
            var salt = Convert.ToBase64String(hmac.Key);
            var hash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(password)));
            return (hash, salt);
        }
        
        private bool VerificarPassword(string password, string hash, string salt)
        {
            var saltBytes = Convert.FromBase64String(salt);
            using var hmac = new HMACSHA512(saltBytes);
            var computedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(password)));
            return hash == computedHash;
        }
        
        private string GenerarTokenSeguro()
        {
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }
        
        private string GenerarJWT(Usuario usuario)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "ElGestorDeTareasEsLaMejorAplicacionDelMundo2024!"));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Name, $"{usuario.Nombre} {usuario.Apellido}"),
                new Claim("UserId", usuario.Id.ToString())
            };
            
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "GestorTareas",
                audience: _configuration["Jwt:Audience"] ?? "GestorTareasUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );
            
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<IEnumerable<UsuarioResponseDTO>> ObtenerTodosLosUsuariosAsync()
        {
            return await _context.Usuarios
                .Select(u => new UsuarioResponseDTO
                {
                    Id = u.Id,
                    Email = u.Email,
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    FechaCreacion = u.FechaCreacion,
                    EmailConfirmado = u.EmailConfirmado
                })
                .ToListAsync();
        }

        public async Task<UsuarioResponseDTO> EditarPerfilAsync(int userId, EditarPerfilDTO editarDTO)
        {
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
            {
                throw new InvalidOperationException("Usuario no encontrado");
            }
            
            // Verificar si el email ya existe en otro usuario
            if (await _context.Usuarios.AnyAsync(u => u.Email == editarDTO.Email && u.Id != userId))
            {
                throw new InvalidOperationException("El email ya está en uso por otro usuario");
            }
            
            // Actualizar datos del usuario
            usuario.Email = editarDTO.Email;
            usuario.Nombre = editarDTO.Nombre;
            usuario.Apellido = editarDTO.Apellido;
            
            await _context.SaveChangesAsync();
            
            return new UsuarioResponseDTO
            {
                Id = usuario.Id,
                Email = usuario.Email,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                FechaCreacion = usuario.FechaCreacion,
                EmailConfirmado = usuario.EmailConfirmado
            };
        }

        public async Task<UsuarioResponseDTO> ObtenerUsuarioPorIdAsync(int userId)
        {
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
            {
                throw new InvalidOperationException("Usuario no encontrado");
            }
            
            return new UsuarioResponseDTO
            {
                Id = usuario.Id,
                Email = usuario.Email,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                FechaCreacion = usuario.FechaCreacion,
                EmailConfirmado = usuario.EmailConfirmado
            };
        }

        public async Task<bool> LogoutAsync(int userId)
        {
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
            {
                return false;
            }
            
            // Actualizar el último acceso para registrar el logout
            usuario.UltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
                u.TokenRecuperacionPassword == token &&
                u.TokenRecuperacionPasswordExpiracion > DateTime.UtcNow);
            if (usuario == null)
            {
                return false;
            }
            var (passwordHash, passwordSalt) = CrearPasswordHash(newPassword);
            usuario.PasswordHash = passwordHash;
            usuario.PasswordSalt = passwordSalt;
            usuario.TokenRecuperacionPassword = null;
            usuario.TokenRecuperacionPasswordExpiracion = null;
            await _context.SaveChangesAsync();
            return true;
        }

        private void EnviarEmailRecuperacion(string email, string token)
        {
            // Configuración SMTP (ajustar según tu proveedor)
            var smtpHost = _configuration["Smtp:Host"] ?? "smtp.example.com";
            var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var smtpUser = _configuration["Smtp:User"] ?? "usuario@example.com";
            var smtpPass = _configuration["Smtp:Pass"] ?? "password";
            var fromEmail = _configuration["Smtp:From"] ?? smtpUser;
            var appUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5036";
            var resetUrl = $"{appUrl}/reset-password?token={Uri.EscapeDataString(token)}";
            var subject = "Recuperación de contraseña";
            var body = $"<p>Has solicitado restablecer tu contraseña.</p><p>Haz clic en el siguiente enlace para restablecerla:</p><p><a href='{resetUrl}'>{resetUrl}</a></p><p>Si no solicitaste este cambio, ignora este correo.</p>";
            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };
            var mail = new MailMessage(fromEmail, email, subject, body)
            {
                IsBodyHtml = true
            };
            try
            {
                client.Send(mail);
            }
            catch (Exception ex)
            {
                // Loguear error, pero no lanzar excepción para no revelar detalles al usuario
                Console.WriteLine($"Error enviando email de recuperación: {ex.Message}");
            }
        }
    }
} 