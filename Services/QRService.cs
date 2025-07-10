using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using GestorTareas.API.Models;

namespace GestorTareas.API.Services
{
    public interface IQRService
    {
        string GenerarQRParaTareaSVG(Tarea tarea, string baseUrl);
        string GenerarURLParaTarea(Tarea tarea, string baseUrl);
    }
    
    public class QRService : IQRService
    {
        public string GenerarQRParaTareaSVG(Tarea tarea, string baseUrl)
        {
            var url = GenerarURLParaTarea(tarea, baseUrl);
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
            var svgQrCode = new SvgQRCode(qrCodeData);
            var svg = svgQrCode.GetGraphic(5);
            return svg;
        }
        
        public string GenerarURLParaTarea(Tarea tarea, string baseUrl)
        {
            // Corregido: ahora la URL apunta al endpoint de la API de tareas
            return $"{baseUrl}/api/tareas/{tarea.Id}";
        }
    }
} 