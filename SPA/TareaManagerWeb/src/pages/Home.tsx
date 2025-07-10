import { useState, useEffect } from "react";
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  CalendarDaysIcon,
  FlagIcon,
  XMarkIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import TaskTable from "../components/TaskTable";
import TaskModal from "../components/TaskModal";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  convertApiTaskToFrontendTask,
  updateTaskStatus,
  statusToInt,
} from "../api/tasksApi.js";
import { useApi } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Task, TaskStatus, TaskPriority } from "../types/task";
import type { TareaApi } from "../types/task";
import { useAuth } from "../contexts/AuthContext";

function Home() {
  // Hook personalizado para obtener tareas de la API
  const {
    data: apiTasks,
    loading: tasksLoading,
    error: tasksError,
    execute: refetchTasks,
  } = useApi<TareaApi[]>(fetchTasks);

  const { user } = useAuth();

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    inReview: 0,
    pending: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<"dueDate" | "status" | "priority">(
    "dueDate"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [crudLoading, setCrudLoading] = useState(false);

  // Actualizar stats cuando cambien las tareas
  useEffect(() => {
    // Usar las tareas filtradas del usuario autenticado
    const filteredTasks = getSortedTasks();
    updateStats(filteredTasks);
  }, [apiTasks, user, sortBy, sortDir]);

  const updateStats = (taskList: Task[]) => {
    setStats({
      total: taskList.length,
      completed: taskList.filter((t) => t.status === "Listo").length,
      inProgress: taskList.filter((t) => t.status === "En curso").length,
      inReview: taskList.filter((t) => t.status === "En revisión").length,
      pending: taskList.filter((t) => t.status === "Pendiente").length,
    });
  };

  const handleAddTask = async (taskData: Omit<Task, "id">) => {
    setCrudLoading(true);
    try {
      if (!user) throw new Error("No hay usuario logueado");
      if (editTask) {
        // Editar tarea existente
        await updateTask(editTask.id.toString(), taskData, user);
        setEditTask(null);
      } else {
        // Nueva tarea
        await createTask(taskData, user);
      }
      // Recargar datos de la API
      refetchTasks();
    } catch (error) {
      console.error("Error al guardar tarea:", error);
      alert("Error al guardar la tarea. Inténtalo de nuevo.");
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      setCrudLoading(true);
      try {
        await deleteTask(id);
        refetchTasks();
      } catch (error) {
        console.error("Error al eliminar tarea:", error);
        alert("Error al eliminar la tarea. Inténtalo de nuevo.");
      } finally {
        setCrudLoading(false);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const handleRowClick = (task: Task) => {
    setDetailTask(task);
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    setCrudLoading(true);
    try {
      const statusInt = statusToInt(newStatus);
      await updateTaskStatus(id, statusInt);
      refetchTasks();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar el estado. Inténtalo de nuevo.");
    } finally {
      setCrudLoading(false);
    }
  };

  // Ordenar tareas
  const getSortedTasks = (): Task[] => {
    if (!apiTasks || !user) return [];
    const frontendTasks: Task[] = apiTasks
      .map(convertApiTaskToFrontendTask)
      .filter((task) => task.usuarioId === user.id);
    const sorted: Task[] = [...frontendTasks];

    if (sortBy === "dueDate") {
      sorted.sort((a, b) =>
        sortDir === "asc"
          ? a.dueDate.localeCompare(b.dueDate)
          : b.dueDate.localeCompare(a.dueDate)
      );
    } else if (sortBy === "priority") {
      const order: TaskPriority[] = ["Baja", "Media", "Alta"];
      sorted.sort((a, b) =>
        sortDir === "asc"
          ? order.indexOf(a.priority) - order.indexOf(b.priority)
          : order.indexOf(b.priority) - order.indexOf(a.priority)
      );
    } else if (sortBy === "status") {
      const order: TaskStatus[] = [
        "Pendiente",
        "En curso",
        "En revisión",
        "Listo",
      ];
      sorted.sort((a, b) =>
        sortDir === "asc"
          ? order.indexOf(a.status) - order.indexOf(b.status)
          : order.indexOf(b.status) - order.indexOf(a.status)
      );
    }
    return sorted;
  };

  // Modal de detalles
  const DetailModal = ({
    task,
    onClose,
  }: {
    task: Task;
    onClose: () => void;
  }) => {
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(true);
    const [qrError, setQrError] = useState("");

    useEffect(() => {
      setQrLoading(true);
      setQrError("");
      setQrUrl(null);
      fetch(`https://gestordetareas-hodt.onrender.com/api/Tareas/${task.id}/qr`)
        .then(async (res) => {
          if (!res.ok) throw new Error("No se pudo obtener el QR");
          const blob = await res.blob();
          setQrUrl(URL.createObjectURL(blob));
        })
        .catch(() => setQrError("No se pudo cargar el QR"))
        .finally(() => setQrLoading(false));
      // Cleanup para liberar el objeto URL
      return () => {
        if (qrUrl) URL.revokeObjectURL(qrUrl);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.id]);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
        <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-fadeIn">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white/70 dark:bg-gray-800/70 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-500 dark:text-blue-300" />
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
              {task.title}
            </h2>
          </div>
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-gray-800 border-l-4 border-blue-400 dark:border-blue-500 text-gray-700 dark:text-gray-200 shadow-sm">
            <p className="whitespace-pre-line text-base">{task.description}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-400 dark:text-blue-300" />
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Responsables:
              </span>
              <span className="text-gray-800 dark:text-gray-100">
                {task.responsables.map((r) => r.name).join(", ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FlagIcon className="w-5 h-5 text-pink-400 dark:text-pink-300" />
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Prioridad:
              </span>
              <span
                className={`inline-block px-2 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors
                ${
                  task.priority === "Alta"
                    ? "bg-gradient-to-r from-red-400 to-red-600 text-white"
                    : task.priority === "Media"
                    ? "bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900"
                    : "bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800 dark:from-gray-700 dark:to-gray-500 dark:text-gray-100"
                }
              `}
              >
                {task.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-green-400 dark:text-green-300" />
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Fecha límite:
              </span>
              <span className="text-gray-800 dark:text-gray-100">
                {task.dueDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Estado:
              </span>
              <span
                className={`inline-block px-2 py-1 rounded-lg text-xs font-bold shadow-sm
                ${
                  task.status === "Listo"
                    ? "bg-green-500 text-white"
                    : task.status === "En curso"
                    ? "bg-yellow-400 text-yellow-900"
                    : task.status === "En revisión"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-400 text-white"
                }
              `}
              >
                {task.status}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
              <QrCodeIcon className="w-5 h-5 text-blue-400 dark:text-blue-300" />{" "}
              Código QR de la tarea:
            </span>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 flex flex-col items-center">
              {qrLoading ? (
                <div className="flex items-center justify-center h-24 w-24">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                </div>
              ) : qrError ? (
                <div className="text-red-500 text-sm">{qrError}</div>
              ) : qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR de la tarea"
                  className="h-32 w-32 object-contain border rounded bg-gray-50 dark:bg-gray-800 shadow"
                />
              ) : null}
            </div>
          </div>
          <button
            className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 text-lg flex items-center justify-center gap-2"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" /> Cerrar
          </button>
        </div>
      </div>
    );
  };

  // Mostrar loading mientras se cargan las tareas
  if (tasksLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Mostrar error si hay problemas con la API
  if (tasksError) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            Error al cargar tareas
          </h3>
          <p className="text-red-600 mb-4">{tasksError}</p>
          <button
            onClick={refetchTasks}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTask(null);
        }}
        onSave={handleAddTask}
        initialData={editTask ? { ...editTask, status: undefined } : undefined}
      />
      {detailTask && (
        <DetailModal task={detailTask} onClose={() => setDetailTask(null)} />
      )}

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
            Dashboard
          </h1>
          <div className="flex gap-4 text-gray-600 text-sm dark:text-gray-100">
            <span>
              Total: <span className="font-semibold">{stats.total}</span>
            </span>
            <span>
              Pendientes: <span className="font-semibold">{stats.pending}</span>
            </span>
            <span>
              En Progreso:{" "}
              <span className="font-semibold">{stats.inProgress}</span>
            </span>
            <span>
              En Revisión:{" "}
              <span className="font-semibold">{stats.inReview}</span>
            </span>
            <span>
              Completadas:{" "}
              <span className="font-semibold">{stats.completed}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          disabled={crudLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 self-start md:self-auto disabled:opacity-50 text-base"
        >
          <PlusIcon className="w-6 h-6" />
          {crudLoading ? "Guardando..." : "Añadir tarea"}
        </button>
      </div>

      {/* Tabla de tareas */}
      <TaskTable
        title="Todas las Tareas"
        loading={tasksLoading || crudLoading}
        tasks={getSortedTasks()}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
        onRowClick={handleRowClick}
        onStatusChange={handleStatusChange}
        sortBy={sortBy}
        sortDir={sortDir}
        setSortBy={setSortBy}
        setSortDir={setSortDir}
      />
    </div>
  );
}

export default Home;
