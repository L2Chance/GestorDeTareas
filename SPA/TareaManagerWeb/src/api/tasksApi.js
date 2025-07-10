import { buildApiUrl, handleApiError } from "../config/api";
import {
  convertPriorityFromApi,
  convertPriorityToApi,
  convertStatusFromApi,
  convertStatusToApi,
} from "../types/task";

// URL base de tu API .NET deployada en Render
const API_URL = buildApiUrl("/api/tareas");

// Función para manejar errores de red
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
};

// Obtener todas las tareas
export const fetchTasks = async () => {
  const response = await fetch(API_URL);
  return handleResponse(response);
};

// Obtener una tarea por ID
export const fetchTaskById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  return handleResponse(response);
};

// Crear nueva tarea
export const createTask = async (task, usuario) => {
  const completada = convertStatusToApi(task.status);
  const body = {
    titulo: task.title,
    descripcion: task.description,
    completada,
    fechaLimite: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    prioridad: convertPriorityToApi(task.priority),
    usuarioId: usuario.id,
    usuario: usuario,
  };
  console.log("Body enviado al crear tarea:", body);
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

// Actualizar tarea existente
export const updateTask = async (taskId, task, usuario) => {
  const completada = convertStatusToApi(task.status);
  const body = {
    titulo: task.title,
    descripcion: task.description,
    completada,
    fechaLimite: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    prioridad: convertPriorityToApi(task.priority),
    usuarioId: usuario.id,
    usuario: usuario,
  };
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

// Eliminar tarea
export const deleteTask = async (taskId) => {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
};

// Verificar salud de la API
export const healthCheck = async () => {
  const response = await fetch(`${API_URL}/health`);
  return handleResponse(response);
};

// Función para convertir tarea de la API al formato del frontend
export const convertApiTaskToFrontendTask = (apiTask) => ({
  id: apiTask.id.toString(),
  title: apiTask.titulo,
  description: apiTask.descripcion,
  status: convertStatusFromApi(apiTask.completada),
  priority: convertPriorityFromApi(apiTask.prioridad),
  dueDate: apiTask.fechaLimite
    ? new Date(apiTask.fechaLimite).toISOString().split("T")[0]
    : "",
  responsables: apiTask.usuario
    ? [
        {
          name: `${apiTask.usuario.nombre} ${apiTask.usuario.apellido}`,
          avatar: `https://ui-avatars.com/api/?name=${apiTask.usuario.nombre}+${apiTask.usuario.apellido}&background=random`,
        },
      ]
    : [{ name: "Usuario", avatar: "https://via.placeholder.com/32" }],
  usuarioId: apiTask.usuarioId,
});

// Función para obtener tareas por período (mantener compatibilidad)
export const getTasksByPeriod = async (period) => {
  const tasks = await fetchTasks();
  const frontendTasks = tasks.map(convertApiTaskToFrontendTask);

  // Filtrar por período si es necesario
  if (period === "current") {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return frontendTasks.filter((task) => {
      if (!task.dueDate) return true;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getMonth() === currentMonth &&
        taskDate.getFullYear() === currentYear
      );
    });
  }

  return frontendTasks;
};
