// Configuración de la API
export const API_CONFIG = {
  // URL base de la API deployada en Render
  BASE_URL:
    import.meta.env.VITE_API_URL || "https://gestordetareas-hodt.onrender.com",

  // Endpoints
  ENDPOINTS: {
    TAREAS: "/api/tareas",
    USUARIOS: "/api/usuarios",
    AUTH: "/api/auth",
    HEALTH: "/api/tareas/health",
  },

  // Configuración de requests
  REQUEST_CONFIG: {
    timeout: 10000, // 10 segundos
    headers: {
      "Content-Type": "application/json",
    },
  },

  // Configuración de reintentos
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000, // 1 segundo
  },
};

// Función para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función para verificar si la API está disponible
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    const response = await fetch(buildApiUrl("/api/tareas/health"), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("API Health Check failed:", error);
    return false;
  }
};

// Función para manejar errores de red
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Error de respuesta del servidor
    return error.response.data?.message || `Error ${error.response.status}`;
  } else if (error.request) {
    // Error de red
    return "Error de conexión. Verifica tu conexión a internet.";
  } else {
    // Otro tipo de error
    return error.message || "Error desconocido";
  }
};
