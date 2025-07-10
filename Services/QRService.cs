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
            // Crear una URL que contenga información de la tarea
            // En una aplicación real, esto podría ser una URL que abra la tarea en el frontend
            return $"{baseUrl}/tareas/{tarea.Id}?titulo={Uri.EscapeDataString(tarea.Titulo)}&estado={tarea.Estado}";
        }
    }
} 