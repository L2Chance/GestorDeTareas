using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestorTareas.API.Models;
using GestorTareas.API.Data;
using GestorTareas.API.Services;
using GestorTareas.API.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace GestorTareas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TareasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IQRService _qrService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TareasController(ApplicationDbContext context, IQRService qrService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _qrService = qrService;
            _httpContextAccessor = httpContextAccessor;
        }

        // Método helper para convertir fecha sin hora a DateTime
        private DateTime? ParseFechaSinHora(string? fechaString)
        {
            if (string.IsNullOrEmpty(fechaString))
                return null;

            // Intentar parsear como fecha ISO completa
            if (DateTime.TryParse(fechaString, out DateTime fechaCompleta))
            {
                // Si es solo fecha (sin hora), establecer la hora a 23:59:59
                if (fechaString.Length <= 10) // Formato YYYY-MM-DD
                {
                    return fechaCompleta.Date.AddDays(1).AddSeconds(-1); // 23:59:59 del día especificado
                }
                return fechaCompleta;
            }

            return null;
        }

        // Método helper para obtener el nombre del estado
        private string GetEstadoNombre(int estado)
        {
            return estado switch
            {
                1 => "Pendiente",
                2 => "En Progreso", 
                3 => "Completada",
                4 => "Cancelada",
                _ => "Desconocido"
            };
        }

        [HttpGet("health")]
        [AllowAnonymous]
        public async Task<ActionResult> HealthCheck()
        {
            try
            {
                // Verificar que la base de datos esté disponible
                await _context.Database.CanConnectAsync();
                return Ok(new { status = "healthy", message = "Database connection successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "unhealthy", message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TareaResponseDTO>>> GetTareas()
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            var tareas = await _context.Tareas
                .Where(t => t.UsuarioId == userId)
                .Include(t => t.Usuario)
                .Select(t => new TareaResponseDTO
                {
                    Id = t.Id,
                    Titulo = t.Titulo,
                    Descripcion = t.Descripcion,
                    Estado = t.Estado,
                    EstadoNombre = GetEstadoNombre(t.Estado),
                    FechaCreacion = t.FechaCreacion,
                    FechaCompletada = t.FechaCompletada,
                    FechaLimite = t.FechaLimite,
                    Prioridad = t.Prioridad,
                    UsuarioId = t.UsuarioId,
                    UsuarioNombre = $"{t.Usuario.Nombre} {t.Usuario.Apellido}"
                })
                .ToListAsync();

            return Ok(tareas);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TareaResponseDTO>> GetTarea(int id)
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            var tarea = await _context.Tareas
                .Include(t => t.Usuario)
                .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == userId);

            if (tarea == null)
                return NotFound();

            var tareaResponse = new TareaResponseDTO
            {
                Id = tarea.Id,
                Titulo = tarea.Titulo,
                Descripcion = tarea.Descripcion,
                Estado = tarea.Estado,
                EstadoNombre = GetEstadoNombre(tarea.Estado),
                FechaCreacion = tarea.FechaCreacion,
                FechaCompletada = tarea.FechaCompletada,
                FechaLimite = tarea.FechaLimite,
                Prioridad = tarea.Prioridad,
                UsuarioId = tarea.UsuarioId,
                UsuarioNombre = $"{tarea.Usuario.Nombre} {tarea.Usuario.Apellido}"
            };

            return Ok(tareaResponse);
        }

        [HttpPost]
        public async Task<ActionResult<TareaResponseDTO>> CrearTarea([FromBody] CrearTareaDTO crearTareaDTO)
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            // Parsear la fecha límite
            var fechaLimite = ParseFechaSinHora(crearTareaDTO.FechaLimite);

            var tarea = new Tarea
            {
                Titulo = crearTareaDTO.Titulo,
                Descripcion = crearTareaDTO.Descripcion,
                Estado = crearTareaDTO.Estado,
                FechaCreacion = DateTime.Now,
                Prioridad = crearTareaDTO.Prioridad,
                FechaLimite = fechaLimite,
                UsuarioId = userId
            };

            _context.Tareas.Add(tarea);
            await _context.SaveChangesAsync();

            // Obtener el usuario para la respuesta
            var usuario = await _context.Usuarios.FindAsync(userId);

            var tareaResponse = new TareaResponseDTO
            {
                Id = tarea.Id,
                Titulo = tarea.Titulo,
                Descripcion = tarea.Descripcion,
                Estado = tarea.Estado,
                EstadoNombre = GetEstadoNombre(tarea.Estado),
                FechaCreacion = tarea.FechaCreacion,
                FechaCompletada = tarea.FechaCompletada,
                FechaLimite = tarea.FechaLimite,
                Prioridad = tarea.Prioridad,
                UsuarioId = tarea.UsuarioId,
                UsuarioNombre = usuario != null ? $"{usuario.Nombre} {usuario.Apellido}" : ""
            };

            return CreatedAtAction(nameof(GetTarea), new { id = tarea.Id }, tareaResponse);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TareaResponseDTO>> ActualizarTarea(int id, [FromBody] ActualizarTareaDTO actualizarTareaDTO)
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == userId);
            if (tarea == null)
                return NotFound();

            // Parsear la fecha límite
            var fechaLimite = ParseFechaSinHora(actualizarTareaDTO.FechaLimite);

            tarea.Titulo = actualizarTareaDTO.Titulo;
            tarea.Descripcion = actualizarTareaDTO.Descripcion;
            tarea.Estado = actualizarTareaDTO.Estado;
            tarea.Prioridad = actualizarTareaDTO.Prioridad;
            tarea.FechaLimite = fechaLimite;

            // Manejar la fecha de completado basada en el estado
            if (tarea.Estado == 3 && !tarea.FechaCompletada.HasValue) // Completada
                tarea.FechaCompletada = DateTime.Now;
            else if (tarea.Estado != 3) // No completada
                tarea.FechaCompletada = null;

            await _context.SaveChangesAsync();

            // Obtener el usuario para la respuesta
            var usuario = await _context.Usuarios.FindAsync(userId);

            var tareaResponse = new TareaResponseDTO
            {
                Id = tarea.Id,
                Titulo = tarea.Titulo,
                Descripcion = tarea.Descripcion,
                Estado = tarea.Estado,
                EstadoNombre = GetEstadoNombre(tarea.Estado),
                FechaCreacion = tarea.FechaCreacion,
                FechaCompletada = tarea.FechaCompletada,
                FechaLimite = tarea.FechaLimite,
                Prioridad = tarea.Prioridad,
                UsuarioId = tarea.UsuarioId,
                UsuarioNombre = usuario != null ? $"{usuario.Nombre} {usuario.Apellido}" : ""
            };

            return Ok(tareaResponse);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> EliminarTarea(int id)
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == userId);
            if (tarea == null)
                return NotFound();

            _context.Tareas.Remove(tarea);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/qr")]
        public async Task<IActionResult> GenerarQRParaTarea(int id)
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == userId);
            if (tarea == null)
                return NotFound("Tarea no encontrada");

            // Obtener la URL base de la aplicación
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";

            // Generar el QR SVG
            var svg = _qrService.GenerarQRParaTareaSVG(tarea, baseUrl);

            // Devolver el SVG
            return Content(svg, "image/svg+xml");
        }

        [HttpGet("{id}/qr-info")]
        public async Task<IActionResult> ObtenerInfoQR(int id)
        {
            // Obtener el ID del usuario autenticado
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == userId);
            if (tarea == null)
                return NotFound("Tarea no encontrada");

            // Obtener la URL base de la aplicación
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";

            // Generar la URL
            var url = _qrService.GenerarURLParaTarea(tarea, baseUrl);

            return Ok(new
            {
                tareaId = tarea.Id,
                titulo = tarea.Titulo,
                url = url,
                qrEndpoint = $"/api/tareas/{tarea.Id}/qr",
                qrImageUrl = $"{baseUrl}/api/tareas/{tarea.Id}/qr"
            });
        }
    }
} 