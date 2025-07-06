using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestorTareas.API.Models;
using GestorTareas.API.Data;

namespace GestorTareas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TareasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TareasController(ApplicationDbContext context)
        {
            _context = context;
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
    }
} 