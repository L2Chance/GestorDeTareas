using System.ComponentModel.DataAnnotations;

namespace GestorTareas.API.DTOs
{
    public class RegistroDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(2)]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;
        
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Apellido { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        [Compare("Password")]
        public string ConfirmarPassword { get; set; } = string.Empty;
    }
    
    public class LoginDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }
    
    public class RecuperarPasswordDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
    
    public class ResetPasswordDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        [MaxLength(100)]
        public string NuevaPassword { get; set; } = string.Empty;
        
        [Required]
        [Compare("NuevaPassword")]
        public string ConfirmarNuevaPassword { get; set; } = string.Empty;
    }
    
    public class ConfirmarEmailDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
    
    public class UsuarioResponseDTO
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public bool EmailConfirmado { get; set; }
    }
    
    public class AuthResponseDTO
    {
        public string Token { get; set; } = string.Empty;
        public UsuarioResponseDTO Usuario { get; set; } = null!;
        public DateTime Expiracion { get; set; }
    }
    
    public class EditarPerfilDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(2)]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;
        
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Apellido { get; set; } = string.Empty;
    }
    
    public class CambiarPasswordDTO
    {
        [Required]
        public string PasswordActual { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        [MaxLength(100)]
        public string NuevaPassword { get; set; } = string.Empty;
        
        [Required]
        [Compare("NuevaPassword")]
        public string ConfirmarNuevaPassword { get; set; } = string.Empty;
    }
    
    // DTOs para Tareas
    public class CrearTareaDTO
    {
        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Descripcion { get; set; } = string.Empty;
        
        [Range(1, 3)]
        public int Prioridad { get; set; } = 1; // 1: Baja, 2: Media, 3: Alta
    }
    
    public class ActualizarTareaDTO
    {
        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Descripcion { get; set; } = string.Empty;
        
        public bool Completada { get; set; }
        
        [Range(1, 3)]
        public int Prioridad { get; set; } = 1;
    }
    
    public class TareaResponseDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public bool Completada { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaCompletada { get; set; }
        public int Prioridad { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
    }
} 