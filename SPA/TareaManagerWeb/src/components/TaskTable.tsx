import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "./LoadingSpinner";
import type { Task, TaskStatus } from "../types/task";

interface TaskTableProps {
  title: string;
  tasks?: Task[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onRowClick?: (task: Task) => void;
  onStatusChange?: (id: string, newStatus: TaskStatus) => void;
  sortBy?: "dueDate" | "status" | "priority";
  sortDir?: "asc" | "desc";
  setSortBy?: (v: "dueDate" | "status" | "priority") => void;
  setSortDir?: (v: "asc" | "desc") => void;
}

const statusConfig = {
  Pendiente: {
    icon: ExclamationTriangleIcon,
    color: "bg-gray-100 text-gray-700",
  },
  Listo: {
    icon: CheckCircleIcon,
    color: "bg-green-100 text-green-700",
  },
  "En curso": {
    icon: ClockIcon,
    color: "bg-yellow-100 text-yellow-700",
  },
  "En revisión": {
    icon: ExclamationTriangleIcon,
    color: "bg-blue-100 text-blue-700",
  },
};

const statusOptions: TaskStatus[] = [
  "Pendiente",
  "En curso",
  "En revisión",
  "Listo",
];

function TaskTable({
  title,
  tasks: propTasks,
  loading = false,
  onDelete,
  onEdit,
  onRowClick,
  onStatusChange,
  sortBy,
  sortDir,
  setSortBy,
  setSortDir,
}: TaskTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!propTasks || propTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <UserIcon className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500">No hay tareas para mostrar</p>
        </div>
      </div>
    );
  }

  // Helper para icono de orden
  const sortIcon = (col: string) => {
    if (!sortBy || !setSortBy || !setSortDir) return null;
    if (sortBy !== col) return <span className="ml-1 text-gray-300">⇅</span>;
    return sortDir === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Tarea
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
              onClick={() => {
                if (setSortBy && setSortDir) {
                  if (sortBy === "status")
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  setSortBy("status");
                }
              }}
            >
              Estado {sortIcon("status")}
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
              onClick={() => {
                if (setSortBy && setSortDir) {
                  if (sortBy === "dueDate")
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  setSortBy("dueDate");
                }
              }}
            >
              Fecha límite {sortIcon("dueDate")}
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
              onClick={() => {
                if (setSortBy && setSortDir) {
                  if (sortBy === "priority")
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  setSortBy("priority");
                }
              }}
            >
              Prioridad {sortIcon("priority")}
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {propTasks.map((task) => {
            const status = statusConfig[task.status];
            const StatusIcon = status.icon;
            return (
              <tr
                key={task.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).tagName === "BUTTON" ||
                    (e.target as HTMLElement).tagName === "SELECT"
                  )
                    return;
                  if (onRowClick) onRowClick(task);
                }}
              >
                {/* Tarea: título y descripción */}
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div
                    className="text-xs text-gray-500 mt-1 max-w-xs truncate"
                    title={task.description}
                  >
                    {task.description}
                  </div>
                </td>
                {/* Estado: select integrado en el badge */}
                <td className="px-4 py-3 align-top">
                  <label
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${status.color} mr-2 cursor-pointer`}
                  >
                    <StatusIcon className="w-4 h-4 mr-1" />
                    <select
                      className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
                      value={task.status}
                      onChange={(e) =>
                        onStatusChange &&
                        onStatusChange(task.id, e.target.value as TaskStatus)
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{ minWidth: 70 }}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                </td>
                {/* Fecha límite */}
                <td className="px-4 py-3 align-top">
                  <span className="text-sm text-gray-700">{task.dueDate}</span>
                </td>
                {/* Prioridad */}
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      task.priority === "Alta"
                        ? "bg-red-100 text-red-700"
                        : task.priority === "Media"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>
                {/* Acciones */}
                <td className="px-4 py-3 align-top">
                  <div className="flex gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(task)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(task.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TaskTable;
