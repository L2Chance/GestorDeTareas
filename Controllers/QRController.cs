using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestorTareas.API.Services;
using GestorTareas.API.Data;
using GestorTareas.API.Models;

namespace GestorTareas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QRController : ControllerBase
    {
        private readonly IQRService _qrService;
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        
        public QRController(IQRService qrService, ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _qrService = qrService;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        
        [HttpGet("tarea/{id}")]
        public async Task<IActionResult> GenerarQRParaTarea(int id)
        {
            var tarea = await _context.Tareas
                .Include(t => t.Usuario)
                .FirstOrDefaultAsync(t => t.Id == id);
                
            if (tarea == null)
            {
                return NotFound("Tarea no encontrada");
            }
            
            // Obtener la URL base de la aplicación
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";
            
            // Generar el QR SVG
            var svg = _qrService.GenerarQRParaTareaSVG(tarea, baseUrl);
            
            // Devolver el SVG
            return Content(svg, "image/svg+xml");
        }
        
        [HttpGet("tarea/{id}/url")]
        public async Task<IActionResult> ObtenerURLParaTarea(int id)
        {
            var tarea = await _context.Tareas
                .Include(t => t.Usuario)
                .FirstOrDefaultAsync(t => t.Id == id);
                
            if (tarea == null)
            {
                return NotFound("Tarea no encontrada");
            }
            
            // Obtener la URL base de la aplicación
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";
            
            // Generar la URL
            var url = _qrService.GenerarURLParaTarea(tarea, baseUrl);
            
            return Ok(new { 
                tareaId = tarea.Id,
                titulo = tarea.Titulo,
                url = url,
                qrEndpoint = $"/api/qr/tarea/{tarea.Id}"
            });
        }
        
        [HttpGet("tarea/{id}/info")]
        public async Task<IActionResult> ObtenerInfoTarea(int id)
        {
            var tarea = await _context.Tareas
                .Include(t => t.Usuario)
                .FirstOrDefaultAsync(t => t.Id == id);
                
            if (tarea == null)
            {
                return NotFound("Tarea no encontrada");
            }
            
            return Ok(new
            {
                id = tarea.Id,
                titulo = tarea.Titulo,
                descripcion = tarea.Descripcion,
                completada = tarea.Completada,
                prioridad = tarea.Prioridad,
                fechaCreacion = tarea.FechaCreacion,
                fechaCompletada = tarea.FechaCompletada,
                usuario = tarea.Usuario != null ? new
                {
                    id = tarea.Usuario.Id,
                    nombre = tarea.Usuario.Nombre,
                    apellido = tarea.Usuario.Apellido
                } : null
            });
        }
    }
} 