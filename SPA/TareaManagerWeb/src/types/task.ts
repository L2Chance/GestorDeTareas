// Tipos para la API
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  passwordHash: string;
  passwordSalt: string;
  fechaCreacion: string;
  ultimoAcceso: string;
  emailConfirmado: boolean;
  tokenConfirmacionEmail: string;
  tokenConfirmacionEmailExpiracion: string;
  tokenRecuperacionPassword: string;
  tokenRecuperacionPasswordExpiracion: string;
  tareas: string[];
}

export interface TareaApi {
  id: number;
  titulo: string;
  descripcion: string;
  completada: boolean;
  fechaCreacion: string;
  fechaCompletada: string;
  prioridad: number; // 1: Baja, 2: Media, 3: Alta
  usuarioId: number;
  usuario: Usuario;
}

// Tipos para el frontend (mantener compatibilidad)
export interface Responsable {
  name: string;
  avatar: string;
}

export type TaskPriority = "Baja" | "Media" | "Alta";

export interface Task {
  id: string;
  title: string;
  description: string;
  responsables: Responsable[];
  status: "Pendiente" | "Listo" | "En curso" | "En revisión";
  dueDate: string; // fecha límite en formato ISO
  priority: TaskPriority;
}

export type TaskStatus = "Pendiente" | "Listo" | "En curso" | "En revisión";

// Funciones de conversión
export const convertPriorityFromApi = (prioridad: number): TaskPriority => {
  switch (prioridad) {
    case 1: return "Baja";
    case 2: return "Media";
    case 3: return "Alta";
    default: return "Media";
  }
};

export const convertPriorityToApi = (priority: TaskPriority): number => {
  switch (priority) {
    case "Baja": return 1;
    case "Media": return 2;
    case "Alta": return 3;
    default: return 2;
  }
};

export const convertStatusFromApi = (completada: boolean): TaskStatus => {
  return completada ? "Listo" : "Pendiente";
};

export const convertStatusToApi = (status: TaskStatus): boolean => {
  return status === "Listo";
};
