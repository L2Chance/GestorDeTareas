import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  validateToken,
} from "../api/authApi";
import type {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth";

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("authToken"),
  isAuthenticated: !!localStorage.getItem("authToken"), // Si hay token, asumir autenticado inicialmente
  loading: true,
  error: null,
};

// Tipos de acciones
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" };

// Reducer para manejar el estado
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Contexto
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función de login
  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await loginApi(credentials);
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.usuario));
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.usuario, token: response.token },
      });
    } catch (error) {
      dispatch({
        type: "AUTH_FAILURE",
        payload:
          error instanceof Error ? error.message : "Error al iniciar sesión",
      });
      throw error;
    }
  };

  // Función de registro
  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await registerApi(credentials);
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.usuario));
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.usuario, token: response.token },
      });
    } catch (error) {
      console.error("Error en registro:", error);
      dispatch({
        type: "AUTH_FAILURE",
        payload:
          error instanceof Error ? error.message : "Error al registrarse",
      });
      throw error;
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Limpiar error
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("user");
      
      if (token && userData) {
        try {
          // Si tenemos token y datos de usuario, restaurar la sesión
          const user = JSON.parse(userData);
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user, token },
          });
          
          // Opcional: validar token en segundo plano sin desloguesr inmediatamente
          validateToken().catch(() => {
            console.warn("Token inválido, pero manteniendo sesión temporal");
          });
          
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          dispatch({ type: "AUTH_LOGOUT" });
        }
      } else {
        // No hay token o datos de usuario
        dispatch({ type: "AUTH_LOGOUT" });
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
