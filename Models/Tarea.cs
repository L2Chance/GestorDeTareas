using System.ComponentModel.DataAnnotations;

namespace GestorTareas.API.Models
{
    public class Tarea
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Descripcion { get; set; } = string.Empty;
        
        [Range(1, 4)]
        public int Estado { get; set; } = 1; // 1: Pendiente, 2: En Progreso, 3: Completada, 4: Cancelada
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public DateTime? FechaCompletada { get; set; }
        
        public DateTime? FechaLimite { get; set; }
        
        [Range(1, 3)]
        public int Prioridad { get; set; } = 1; // 1: Baja, 2: Media, 3: Alta
        
        // Relación con Usuario
        public int UsuarioId { get; set; }
        public virtual Usuario Usuario { get; set; } = null!;
    }
} 