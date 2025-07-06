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
        public DbSet<Usuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuración de Tarea
            modelBuilder.Entity<Tarea>()
                .Property(t => t.Titulo)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<Tarea>()
                .Property(t => t.Descripcion)
                .HasMaxLength(1000);

            // Configuración de Usuario
            modelBuilder.Entity<Usuario>()
                .Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .Property(u => u.Nombre)
                .IsRequired()
                .HasMaxLength(50);

            modelBuilder.Entity<Usuario>()
                .Property(u => u.Apellido)
                .IsRequired()
                .HasMaxLength(100);

            modelBuilder.Entity<Usuario>()
                .Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            modelBuilder.Entity<Usuario>()
                .Property(u => u.PasswordSalt)
                .IsRequired()
                .HasMaxLength(255);

            // Relación Usuario-Tarea
            modelBuilder.Entity<Tarea>()
                .HasOne(t => t.Usuario)
                .WithMany(u => u.Tareas)
                .HasForeignKey(t => t.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
} 