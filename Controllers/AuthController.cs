using Microsoft.AspNetCore.Mvc;
using GestorTareas.API.Services;
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
    }
} 