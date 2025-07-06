using System.ComponentModel.DataAnnotations;

namespace GestorTareas.API.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Apellido { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string PasswordSalt { get; set; } = string.Empty;
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public DateTime? UltimoAcceso { get; set; }
        
        public bool EmailConfirmado { get; set; } = false;
        
        [MaxLength(255)]
        public string? TokenConfirmacionEmail { get; set; }
        
        public DateTime? TokenConfirmacionEmailExpiracion { get; set; }
        
        [MaxLength(255)]
        public string? TokenRecuperacionPassword { get; set; }
        
        public DateTime? TokenRecuperacionPasswordExpiracion { get; set; }
        
        // Relación con tareas (un usuario puede tener muchas tareas)
        public virtual ICollection<Tarea> Tareas { get; set; } = new List<Tarea>();
    }
} 