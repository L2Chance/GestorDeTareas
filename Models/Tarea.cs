using System;
using System.ComponentModel.DataAnnotations;

namespace MVC.Models
{
    public class Tarea
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Titulo { get; set; }

        [Required]
        [StringLength(500)]
        public string Descripcion { get; set; }

        [Display(Name = "Fecha de Vencimiento")]
        [DataType(DataType.DateTime)]
        public DateTime FechaVencimiento { get; set; }

        [Display(Name = "Tarea Completada")]
        public bool Completada { get; set; }

        [Required]
        [StringLength(20)]
        public string Prioridad { get; set; } // Ejemplo: Alta, Media, Baja

        [Display(Name = "Fecha de Creación")]
        public DateTime FechaCreacion { get; set; }

        public string UserId { get; set; }
    }
} 