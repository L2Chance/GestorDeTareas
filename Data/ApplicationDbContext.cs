using Microsoft.EntityFrameworkCore;
using GestorTareas.API.Models;

namespace GestorTareas.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Tarea> Tareas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuración adicional del modelo si es necesaria
            modelBuilder.Entity<Tarea>()
                .Property(t => t.Titulo)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<Tarea>()
                .Property(t => t.Descripcion)
                .HasMaxLength(1000);
        }
    }
} 