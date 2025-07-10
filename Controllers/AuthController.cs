using Microsoft.AspNetCore.Mvc;
using GestorTareas.API.Services;
using Microsoft.AspNetCore.Authorization;
using GestorTareas.API.DTOs;

namespace GestorTareas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }
        
        [HttpPost("registro")]
        public async Task<ActionResult<AuthResponseDTO>> Registro([FromBody] RegistroDTO registroDTO)
        {
            try
            {
                var resultado = await _authService.RegistrarAsync(registroDTO);
                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDTO>> Login([FromBody] LoginDTO loginDTO)
        {
            try
            {
                var resultado = await _authService.LoginAsync(loginDTO);
                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpPost("confirmar-email")]
        public async Task<ActionResult> ConfirmarEmail([FromBody] ConfirmarEmailDTO confirmarDTO)
        {
            var resultado = await _authService.ConfirmarEmailAsync(confirmarDTO.Token);
            
            if (!resultado)
            {
                return BadRequest(new { message = "Token inválido o expirado" });
            }
            
            return Ok(new { message = "Email confirmado correctamente" });
        }
        
        [HttpGet("usuarios")]
        public async Task<ActionResult<IEnumerable<UsuarioResponseDTO>>> GetUsuarios()
        {
            try
            {
                var usuarios = await _authService.ObtenerTodosLosUsuariosAsync();
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener usuarios", error = ex.Message });
            }
        }
        
        [Authorize]
        [HttpPut("usuario")]
        public async Task<ActionResult<UsuarioResponseDTO>> EditarUsuario([FromBody] EditarPerfilDTO editarDTO)
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Token inválido o usuario no autenticado" });
                }
                
                var usuario = await _authService.EditarPerfilAsync(userId, editarDTO);
                return Ok(usuario);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al editar usuario", error = ex.Message });
            }
        }
        
        [HttpGet("usuario-autenticado")]
        public async Task<ActionResult<UsuarioResponseDTO>> ObtenerUsuarioAutenticado()
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Token inválido o usuario no autenticado" });
                }
                
                var usuario = await _authService.ObtenerUsuarioPorIdAsync(userId);
                return Ok(usuario);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener usuario autenticado", error = ex.Message });
            }
        }
        
        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Token inválido o usuario no autenticado" });
                }
                
                await _authService.LogoutAsync(userId);
                return Ok(new { message = "Sesión cerrada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al cerrar sesión", error = ex.Message });
            }
        }
        
        [Authorize]
        [HttpGet("test-auth")]
        public ActionResult TestAuth()
        {
            try
            {
                // Obtener información del token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email);
                var nameClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                
                return Ok(new 
                { 
                    message = "Autenticación exitosa",
                    userId = userIdClaim?.Value,
                    email = emailClaim?.Value,
                    name = nameClaim?.Value,
                    claims = User.Claims.Select(c => new { type = c.Type, value = c.Value }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error en test de autenticación", error = ex.Message });
            }
        }
        
        [HttpGet("verify-token")]
        public ActionResult VerifyToken()
        {
            try
            {
                // Obtener el token del header Authorization
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                
                if (string.IsNullOrEmpty(authHeader))
                {
                    return BadRequest(new { message = "No se encontró el header Authorization" });
                }
                
                if (!authHeader.StartsWith("Bearer "))
                {
                    return BadRequest(new { message = "El header Authorization debe comenzar con 'Bearer '" });
                }
                
                var token = authHeader.Substring("Bearer ".Length);
                
                // Verificar que el token no esté vacío
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new { message = "El token está vacío" });
                }
                
                return Ok(new 
                { 
                    message = "Token recibido correctamente",
                    tokenLength = token.Length,
                    tokenStartsWith = token.Substring(0, Math.Min(20, token.Length)) + "...",
                    hasBearer = authHeader.StartsWith("Bearer ")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al verificar token", error = ex.Message });
            }
        }
    }
} 