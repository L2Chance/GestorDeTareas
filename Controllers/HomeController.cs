using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MVC.Models;
using MVC.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace MVC.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;

    public HomeController(ILogger<HomeController> logger, ApplicationDbContext context, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager)
    {
        _logger = logger;
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
    }

    public IActionResult Index()
    {
        if (User.Identity != null && _signInManager.IsSignedIn(User))
        {
            return RedirectToAction("Index", "Tareas");
        }
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }

    [Authorize]
    public async Task<IActionResult> Diagnostico()
    {
        var diagnosticInfo = new
        {
            IsAuthenticated = User.Identity?.IsAuthenticated ?? false,
            UserName = User.Identity?.Name,
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Claims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList(),
            TotalUsers = await _userManager.Users.CountAsync(),
            TotalTareas = await _context.Tareas.CountAsync(),
            CurrentUserTareas = await _context.Tareas.Where(t => t.UserId == User.FindFirstValue(ClaimTypes.NameIdentifier)).CountAsync()
        };

        return Json(diagnosticInfo);
    }
}
