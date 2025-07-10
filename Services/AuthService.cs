using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using GestorTareas.API.Models;
using GestorTareas.API.DTOs;
using GestorTareas.API.Data;
using Microsoft.EntityFrameworkCore;

namespace GestorTareas.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDTO> RegistrarAsync(RegistroDTO registroDTO);
        Task<AuthResponseDTO> LoginAsync(LoginDTO loginDTO);
        Task<bool> RecuperarPasswordAsync(string email);
        Task<bool> ResetPasswordAsync(ResetPasswordDTO resetDTO);
        Task<bool> ConfirmarEmailAsync(string token);
        Task<bool> EnviarEmailConfirmacionAsync(string email);
        Task<IEnumerable<UsuarioResponseDTO>> ObtenerTodosLosUsuariosAsync();
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
            
            // TODO: Enviar email con el token
            // Por ahora, solo retornamos true
            return true;
        }
        
        public async Task<bool> ResetPasswordAsync(ResetPasswordDTO resetDTO)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => 
                u.TokenRecuperacionPassword == resetDTO.Token && 
                u.TokenRecuperacionPasswordExpiracion > DateTime.UtcNow);
            
            if (usuario == null)
            {
                return false;
            }
            
            // Crear nuevo hash y salt
            var (passwordHash, passwordSalt) = CrearPasswordHash(resetDTO.NuevaPassword);
            
            usuario.PasswordHash = passwordHash;
            usuario.PasswordSalt = passwordSalt;
            usuario.TokenRecuperacionPassword = null;
            usuario.TokenRecuperacionPasswordExpiracion = null;
            
            await _context.SaveChangesAsync();
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
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "TuClaveSecretaSuperSegura123!"));
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
    }
} 