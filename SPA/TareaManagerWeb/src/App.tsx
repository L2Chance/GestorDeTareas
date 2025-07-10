import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import LoadingSpinner from "./components/LoadingSpinner";
import { useEffect, useState } from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { forgotPassword, resetPassword } from "./api/authApi";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas públicas (solo para usuarios no autenticados)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Componente principal de la aplicación
const AppContent = () => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // Modal state for forgot/reset password
  const [step, setStep] = useState<"forgot" | "reset">("forgot");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Al cargar, leer preferencia de localStorage o sistema
    const saved = localStorage.getItem("theme");
    if (
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const closeModals = () => {
    setShowPasswordModal(false);
    setStep("forgot");
    setEmail("");
    setToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await forgotPassword(email);
      setSuccess("Se envió un correo con instrucciones. Revisa tu email.");
      setStep("reset");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error al solicitar recuperación.");
      } else {
        setError("Error al solicitar recuperación.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    try {
      await resetPassword({ token, newPassword, confirmPassword });
      setSuccess("¡Contraseña restablecida correctamente!");
      setTimeout(() => closeModals(), 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error al restablecer contraseña.");
      } else {
        setError("Error al restablecer contraseña.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          {user ? (
            <Link
              to="/"
              className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 flex items-center gap-2 hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <ClipboardDocumentListIcon className="w-7 h-7 text-blue-500 dark:text-blue-300 drop-shadow-md" />
              <span>Gestor de Tareas</span>
            </Link>
          ) : (
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-7 h-7 text-blue-500 dark:text-blue-300 drop-shadow-md" />
              <span>Gestor de Tareas</span>
            </h1>
          )}
          <div className="flex items-center gap-4">
            {/* Botón modo oscuro/claro */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? (
                <span role="img" aria-label="Sol">
                  🌞
                </span>
              ) : (
                <span role="img" aria-label="Luna">
                  🌙
                </span>
              )}
            </button>
            {user && (
              <div className="relative group">
                <button className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-4 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer shadow-sm focus:outline-none">
                  {user.nombre}
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 z-50 invisible group-hover:visible group-focus-within:visible">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cambiar contraseña
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Password Modals */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
              onClick={closeModals}
              aria-label="Cerrar"
            >
              ×
            </button>
            {step === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <h2 className="text-xl font-bold mb-2">Recuperar contraseña</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Ingresa tu email para recibir instrucciones.
                </p>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {success && (
                  <div className="text-green-600 text-sm">{success}</div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModals}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </form>
            )}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <h2 className="text-xl font-bold mb-2">
                  Restablecer contraseña
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Copia el token recibido por email y elige tu nueva contraseña.
                </p>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {success && (
                  <div className="text-green-600 text-sm">{success}</div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModals}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Restableciendo..." : "Restablecer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente raíz con el provider de autenticación
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
