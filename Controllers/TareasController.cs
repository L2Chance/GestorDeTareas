using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using MVC.Data;
using MVC.Models;
using System.Security.Claims;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;

namespace MVC.Controllers
{
    [Authorize]
    public class TareasController : Controller
    {
        private readonly ApplicationDbContext _context;
        private const int PageSize = 10;

        public TareasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Tareas
        public async Task<IActionResult> Index(string sortOrder, string currentFilter, string searchString, int? pageNumber)
        {
            ViewData["CurrentSort"] = sortOrder;
            ViewData["TituloSortParm"] = String.IsNullOrEmpty(sortOrder) ? "titulo_desc" : "";
            ViewData["FechaSortParm"] = sortOrder == "fecha" ? "fecha_desc" : "fecha";
            ViewData["PrioridadSortParm"] = sortOrder == "prioridad" ? "prioridad_desc" : "prioridad";
            ViewData["EstadoSortParm"] = sortOrder == "estado" ? "estado_desc" : "estado";

            if (searchString != null)
            {
                pageNumber = 1;
            }
            else
            {
                searchString = currentFilter;
            }

            ViewData["CurrentFilter"] = searchString;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            System.Diagnostics.Debug.WriteLine($"[Index] User.Identity.IsAuthenticated: {User.Identity.IsAuthenticated}");
            System.Diagnostics.Debug.WriteLine($"[Index] UserId: {userId}");
            foreach (var claim in User.Claims)
            {
                System.Diagnostics.Debug.WriteLine($"[Index] Claim: {claim.Type} = {claim.Value}");
            }
            var tareas = from t in _context.Tareas
                        where t.UserId == userId
                        select t;

            if (!String.IsNullOrEmpty(searchString))
            {
                tareas = tareas.Where(s => s.Titulo.Contains(searchString)
                                       || s.Descripcion.Contains(searchString));
            }

            tareas = sortOrder switch
            {
                "titulo_desc" => tareas.OrderByDescending(s => s.Titulo),
                "fecha" => tareas.OrderBy(s => s.FechaVencimiento),
                "fecha_desc" => tareas.OrderByDescending(s => s.FechaVencimiento),
                "prioridad" => tareas.OrderBy(s => s.Prioridad),
                "prioridad_desc" => tareas.OrderByDescending(s => s.Prioridad),
                "estado" => tareas.OrderBy(s => s.Completada),
                "estado_desc" => tareas.OrderByDescending(s => s.Completada),
                _ => tareas.OrderBy(s => s.Titulo),
            };

            return View(await PaginatedList<Tarea>.CreateAsync(tareas.AsNoTracking(), pageNumber ?? 1, PageSize));
        }

        // GET: Tareas/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var tarea = await _context.Tareas
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (tarea == null)
            {
                return NotFound();
            }

            return View(tarea);
        }

        // GET: Tareas/Create
        public IActionResult Create()
        {
            var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            System.Diagnostics.Debug.WriteLine($"[Create-GET] User.Identity.IsAuthenticated: {User.Identity.IsAuthenticated}");
            System.Diagnostics.Debug.WriteLine($"[Create-GET] UserId: {userId}");
            foreach (var claim in User.Claims)
            {
                System.Diagnostics.Debug.WriteLine($"[Create-GET] Claim: {claim.Type} = {claim.Value}");
            }
            ViewBag.Prioridades = new SelectList(new[] { "Alta", "Media", "Baja" });
            return View();
        }

        // POST: Tareas/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Titulo,Descripcion,FechaVencimiento,Prioridad")] Tarea tarea)
        {
            Console.WriteLine("=== INICIO CREATE POST ===");
            Console.WriteLine($"[Create-POST] User.Identity.IsAuthenticated: {User.Identity.IsAuthenticated}");
            Console.WriteLine($"[Create-POST] User.Identity.Name: {User.Identity.Name}");
            
            // Log de todos los datos del formulario
            Console.WriteLine("=== DATOS DEL FORMULARIO ===");
            foreach (var key in Request.Form.Keys)
            {
                Console.WriteLine($"Form[{key}]: {Request.Form[key]}");
            }
            
            var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            Console.WriteLine($"[Create-POST] UserId encontrado: {userId}");
            
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"[Create-POST] Claim: {claim.Type} = {claim.Value}");
            }
            
            // Limpiar el ModelState del UserId para que no cause errores de validación
            ModelState.Remove("UserId");
            
            Console.WriteLine($"[Create-POST] ModelState.IsValid: {ModelState.IsValid}");
            Console.WriteLine($"[Create-POST] Tarea recibida - Titulo: {tarea.Titulo}, Descripcion: {tarea.Descripcion}, FechaVencimiento: {tarea.FechaVencimiento}, Prioridad: {tarea.Prioridad}");
            
            if (!ModelState.IsValid)
            {
                Console.WriteLine("=== ERRORES DE VALIDACIÓN ===");
                foreach (var key in ModelState.Keys)
                {
                    var errors = ModelState[key].Errors;
                    foreach (var error in errors)
                    {
                        Console.WriteLine($"Error en {key}: {error.ErrorMessage}");
                    }
                }
                ViewBag.Prioridades = new SelectList(new[] { "Alta", "Media", "Baja" });
                return View(tarea);
            }

            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("ERROR: UserId es nulo o vacío");
                ModelState.AddModelError(string.Empty, "No se pudo identificar al usuario. Por favor, cierre sesión y vuelva a iniciar sesión.");
                ViewBag.Prioridades = new SelectList(new[] { "Alta", "Media", "Baja" });
                return View(tarea);
            }

            tarea.UserId = userId;
            tarea.FechaCreacion = DateTime.Now;
            tarea.Completada = false;

            Console.WriteLine($"[Create-POST] Tarea preparada - UserId: {tarea.UserId}, FechaCreacion: {tarea.FechaCreacion}, Completada: {tarea.Completada}");

            try
            {
                Console.WriteLine("Agregando tarea al contexto...");
                _context.Add(tarea);
                Console.WriteLine("Guardando cambios en la base de datos...");
                await _context.SaveChangesAsync();
                Console.WriteLine("Tarea guardada exitosamente");
                Console.WriteLine("=== FIN CREATE POST (EXITOSO) ===");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== ERROR AL GUARDAR TAREA ===");
                Console.WriteLine($"Error al guardar tarea: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                ModelState.AddModelError(string.Empty, "Ocurrió un error al guardar la tarea. Por favor, intente nuevamente o contacte al administrador.");
                ViewBag.Prioridades = new SelectList(new[] { "Alta", "Media", "Baja" });
                return View(tarea);
            }
            return RedirectToAction(nameof(Index));
        }

        // GET: Tareas/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var tarea = await _context.Tareas
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (tarea == null)
            {
                return NotFound();
            }

            ViewBag.Prioridades = new SelectList(new[] { "Alta", "Media", "Baja" });
            return View(tarea);
        }

        // POST: Tareas/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Titulo,Descripcion,FechaVencimiento,Prioridad,Completada")] Tarea tarea)
        {
            if (id != tarea.Id)
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var existingTarea = await _context.Tareas
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (existingTarea == null)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    existingTarea.Titulo = tarea.Titulo;
                    existingTarea.Descripcion = tarea.Descripcion;
                    existingTarea.FechaVencimiento = tarea.FechaVencimiento;
                    existingTarea.Prioridad = tarea.Prioridad;
                    existingTarea.Completada = tarea.Completada;

                    _context.Update(existingTarea);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!TareaExists(tarea.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }

            ViewBag.Prioridades = new SelectList(new[] { "Alta", "Media", "Baja" });
            return View(tarea);
        }

        // GET: Tareas/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var tarea = await _context.Tareas
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (tarea == null)
            {
                return NotFound();
            }

            return View(tarea);
        }

        // POST: Tareas/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var tarea = await _context.Tareas
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (tarea != null)
            {
                _context.Tareas.Remove(tarea);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        // POST: Tareas/ToggleComplete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleComplete(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var tarea = await _context.Tareas
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (tarea != null)
            {
                tarea.Completada = !tarea.Completada;
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        // GET: Tareas/QR/5
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> QR(int id)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null)
            {
                return NotFound();
            }
            // URL a la que debe apuntar el QR
            var url = Url.Action("Details", "Tareas", new { id = tarea.Id }, protocol: Request.Scheme);
            var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
            var pngQr = new PngByteQRCode(qrData);
            var qrBytes = pngQr.GetGraphic(20);
            return File(qrBytes, "image/png");
        }

        private bool TareaExists(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return _context.Tareas.Any(e => e.Id == id && e.UserId == userId);
        }
    }
} 