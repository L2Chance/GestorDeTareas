import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import LoadingSpinner from "./components/LoadingSpinner";
import { useEffect, useState } from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

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
