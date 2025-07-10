// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
#nullable disable

using System;
using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;

namespace MVC.Areas.Identity.Pages.Account
{
    public class ForgotPasswordModel : PageModel
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IEmailSender _emailSender;

        public ForgotPasswordModel(UserManager<IdentityUser> userManager, IEmailSender emailSender)
        {
            _userManager = userManager;
            _emailSender = emailSender;
        }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [BindProperty]
        public InputModel Input { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public class InputModel
        {
            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [Required]
            [EmailAddress]
            public string Email { get; set; }
        }

        public async Task<IActionResult> OnPostAsync()
        {
            Console.WriteLine("[DEBUG] Entrando a OnPostAsync de ForgotPassword");
            if (ModelState.IsValid)
            {
                var user = await _userManager.FindByEmailAsync(Input.Email);
                if (user == null)
                {
                    Console.WriteLine("[DEBUG] Usuario no existe en la base de datos.");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Usuario encontrado: {user.Email}, EmailConfirmed: {user.EmailConfirmed}");
                }
                if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
                {
                    Console.WriteLine("[DEBUG] Usuario no existe o no está confirmado.");
                    // No revelar si el usuario no existe o no está confirmado
                    return RedirectToPage("./ForgotPasswordConfirmation");
                }

                var code = await _userManager.GeneratePasswordResetTokenAsync(user);
                code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
                var callbackUrl = Url.Page(
                    "/Account/ResetPassword",
                    pageHandler: null,
                    values: new { area = "Identity", code },
                    protocol: Request.Scheme);

                try
                {
                    Console.WriteLine($"[DEBUG] Enviando correo de restablecimiento a: {Input.Email}");
                await _emailSender.SendEmailAsync(
                    Input.Email,
                        "Restablecimiento de contraseña - Herba Mate",
                        $"Para restablecer su contraseña, haga clic en <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>este enlace</a>.");
                    Console.WriteLine("[DEBUG] Correo de restablecimiento enviado correctamente.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Error enviando correo de restablecimiento: {ex.Message}");
                    throw;
                }

                return RedirectToPage("./ForgotPasswordConfirmation");
            }

            return Page();
        }
    }
}
