import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "../types/auth";

/**
 * API de Autenticación
 *
 * NOTA IMPORTANTE: Este archivo incluye un sistema de autenticación temporal
 * para permitir el desarrollo del frontend mientras se implementan los endpoints
 * de autenticación en el backend.
 *
 * Una vez que los endpoints /api/auth/login, /api/auth/register, /api/auth/me
 * estén disponibles en el backend, este sistema temporal se puede reemplazar.
 */

// Iniciar sesión
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await fetch(
      "https://gestordetareas-hodt.onrender.com/api/Auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }
    // Suponiendo que el backend devuelve el usuario y el token
    const data = await response.json();
    console.log("Respuesta del backend al login:", data);
    return data;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

// Registrarse
export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  try {
    const response = await fetch(
      "https://gestordetareas-hodt.onrender.com/api/Auth/registro",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          nombre: credentials.name,
          apellido: credentials.name,
          password: credentials.password,
          confirmarPassword: credentials.confirmPassword,
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }
    // Suponiendo que el backend devuelve el usuario y el token
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en register:", error);
    throw error;
  }
};

// Cerrar sesión
export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No hay token de autenticación");
    await fetch("https://gestordetareas-hodt.onrender.com/api/Auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }
};

// Obtener usuario actual
export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }
  const response = await fetch(
    "https://gestordetareas-hodt.onrender.com/api/Auth/usuario-autenticado",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  const user = await response.json();
  return user;
};

// Verificar si el token es válido
export const validateToken = async (): Promise<boolean> => {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
};

// Actualizar perfil
export const updateProfile = async (profile: {
  nombre: string;
  apellido: string;
  email: string;
}) => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("No hay token de autenticación");
  const response = await fetch(
    "https://gestordetareas-hodt.onrender.com/api/Auth/usuario",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
};

// Cambiar contraseña
export const changePassword = async (data: {
  passwordActual: string;
  nuevaPassword: string;
  confirmarNuevaPassword: string;
}) => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("No hay token de autenticación");
  const response = await fetch(
    "https://gestordetareas-hodt.onrender.com/api/Auth/cambiar-password",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (email: string) => {
  const response = await fetch(
    "https://gestordetareas-hodt.onrender.com/api/Auth/forgot-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
};

// Restablecer contraseña con token
export const resetPassword = async (data: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const response = await fetch(
    "https://gestordetareas-hodt.onrender.com/api/Auth/reset-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
};
