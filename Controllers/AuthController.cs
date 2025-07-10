using Microsoft.AspNetCore.Mvc;
using GestorTareas.API.Services;
using GestorTareas.API.DTOs;
using Microsoft.AspNetCore.Authorization;

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
        
        [HttpPost("recuperar-password")]
        public async Task<ActionResult> RecuperarPassword([FromBody] RecuperarPasswordDTO recuperarDTO)
        {
            var resultado = await _authService.RecuperarPasswordAsync(recuperarDTO.Email);
            
            // Siempre retornamos éxito por seguridad (no revelamos si el email existe)
            return Ok(new { message = "Si el email existe, recibirás un enlace para recuperar tu contraseña" });
        }
        
        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDTO resetDTO)
        {
            var resultado = await _authService.ResetPasswordAsync(resetDTO);
            
            if (!resultado)
            {
                return BadRequest(new { message = "Token inválido o expirado" });
            }
            
            return Ok(new { message = "Contraseña actualizada correctamente" });
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
        
        [HttpPost("reenviar-confirmacion")]
        public async Task<ActionResult> ReenviarConfirmacion([FromBody] RecuperarPasswordDTO emailDTO)
        {
            var resultado = await _authService.EnviarEmailConfirmacionAsync(emailDTO.Email);
            
            if (!resultado)
            {
                return BadRequest(new { message = "Email no encontrado o ya confirmado" });
            }
            
            return Ok(new { message = "Email de confirmación enviado" });
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
        
        [Authorize]
        [HttpPut("cambiar-password")]
        public async Task<ActionResult> CambiarPassword([FromBody] CambiarPasswordDTO cambiarPasswordDTO)
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Token inválido o usuario no autenticado" });
                }
                
                await _authService.CambiarPasswordAsync(userId, cambiarPasswordDTO);
                return Ok(new { message = "Contraseña cambiada correctamente" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al cambiar contraseña", error = ex.Message });
            }
        }
        
        [Authorize]
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
    }
} 