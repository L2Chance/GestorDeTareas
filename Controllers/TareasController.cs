using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestorTareas.API.Models;
using GestorTareas.API.Data;
using GestorTareas.API.Services;

namespace GestorTareas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        [HttpGet("health")]
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
        public async Task<ActionResult<IEnumerable<Tarea>>> GetTareas()
        {
            return await _context.Tareas.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Tarea>> GetTarea(int id)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null)
                return NotFound();

            return Ok(tarea);
        }

        [HttpPost]
        public async Task<ActionResult<Tarea>> CrearTarea([FromBody] Tarea tarea)
        {
            tarea.FechaCreacion = DateTime.Now;
            _context.Tareas.Add(tarea);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTarea), new { id = tarea.Id }, tarea);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> ActualizarTarea(int id, [FromBody] Tarea tareaActualizada)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null)
                return NotFound();

            tarea.Titulo = tareaActualizada.Titulo;
            tarea.Descripcion = tareaActualizada.Descripcion;
            tarea.Completada = tareaActualizada.Completada;
            tarea.Prioridad = tareaActualizada.Prioridad;

            if (tarea.Completada && !tarea.FechaCompletada.HasValue)
                tarea.FechaCompletada = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> EliminarTarea(int id)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null)
                return NotFound();

            _context.Tareas.Remove(tarea);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/qr")]
        public async Task<IActionResult> GenerarQRParaTarea(int id)
        {
            var tarea = await _context.Tareas.FindAsync(id);
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
            var tarea = await _context.Tareas.FindAsync(id);
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