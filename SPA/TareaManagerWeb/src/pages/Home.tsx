import { useState, useEffect } from "react";
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import TaskTable from "../components/TaskTable";
import TaskModal from "../components/TaskModal";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api/tasksApi.js";
import { convertApiTaskToFrontendTask } from "../api/tasksApi.js";
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
    execute: refetchTasks 
  } = useApi<TareaApi[]>(fetchTasks);

  const { user } = useAuth();

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    inReview: 0,
    pending: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<"dueDate" | "status" | "priority">("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [crudLoading, setCrudLoading] = useState(false);

  // Actualizar stats cuando cambien las tareas
  useEffect(() => {
    if (apiTasks) {
      const frontendTasks: Task[] = apiTasks.map(convertApiTaskToFrontendTask);
      updateStats(frontendTasks);
    }
  }, [apiTasks]);

  const updateStats = (taskList: Task[]) => {
    setStats({
      total: taskList.length,
      completed: taskList.filter(t => t.status === "Listo").length,
      inProgress: taskList.filter(t => t.status === "En curso").length,
      inReview: taskList.filter(t => t.status === "En revisión").length,
      pending: taskList.filter(t => t.status === "Pendiente").length
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
      console.error('Error al guardar tarea:', error);
      alert('Error al guardar la tarea. Inténtalo de nuevo.');
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      setCrudLoading(true);
      try {
        await deleteTask(id);
        refetchTasks();
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea. Inténtalo de nuevo.');
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
      const taskToUpdate = apiTasks?.find(t => t.id.toString() === id);
      if (taskToUpdate) {
        const frontendTask: Task = convertApiTaskToFrontendTask(taskToUpdate);
        await updateTask(taskToUpdate.id.toString(), {
          ...frontendTask,
          status: newStatus
        }, user);
        refetchTasks();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado. Inténtalo de nuevo.');
    } finally {
      setCrudLoading(false);
    }
  };

  // Ordenar tareas
  const getSortedTasks = (): Task[] => {
    if (!apiTasks) return [];
    
    const frontendTasks: Task[] = apiTasks.map(convertApiTaskToFrontendTask);
    const sorted: Task[] = [...frontendTasks];
    
    if (sortBy === "dueDate") {
      sorted.sort((a, b) => sortDir === "asc" ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate));
    } else if (sortBy === "priority") {
      const order: TaskPriority[] = ["Baja", "Media", "Alta"];
      sorted.sort((a, b) => sortDir === "asc" ? order.indexOf(a.priority) - order.indexOf(b.priority) : order.indexOf(b.priority) - order.indexOf(a.priority));
    } else if (sortBy === "status") {
      const order: TaskStatus[] = ["Pendiente", "En curso", "En revisión", "Listo"];
      sorted.sort((a, b) => sortDir === "asc" ? order.indexOf(a.status) - order.indexOf(b.status) : order.indexOf(b.status) - order.indexOf(a.status));
    }
    return sorted;
  };

  // Modal de detalles
  const DetailModal = ({ task, onClose }: { task: Task, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">{task.title}</h2>
        <p className="text-gray-700 mb-2">{task.description}</p>
        <div className="mb-2"><span className="font-semibold">Responsables:</span> {task.responsables.map(r => r.name).join(", ")}</div>
        <div className="mb-2"><span className="font-semibold">Estado:</span> {task.status}</div>
        <div className="mb-2"><span className="font-semibold">Fecha límite:</span> {task.dueDate}</div>
        <div className="mb-2"><span className="font-semibold">Prioridad:</span> {task.priority}</div>
        <button className="btn-primary mt-4" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );

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
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error al cargar tareas</h3>
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
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSave={handleAddTask}
        initialData={editTask ? { ...editTask, status: undefined } : undefined}
      />
      {detailTask && <DetailModal task={detailTask} onClose={() => setDetailTask(null)} />}
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <div className="flex gap-4 text-gray-600 text-sm">
            <span>Total: <span className="font-semibold">{stats.total}</span></span>
            <span>Pendientes: <span className="font-semibold">{stats.pending}</span></span>
            <span>En Progreso: <span className="font-semibold">{stats.inProgress}</span></span>
            <span>En Revisión: <span className="font-semibold">{stats.inReview}</span></span>
            <span>Completadas: <span className="font-semibold">{stats.completed}</span></span>
          </div>
        </div>
        <button 
          onClick={() => setModalOpen(true)} 
          disabled={crudLoading}
          className="btn-primary flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" /> 
          {crudLoading ? 'Guardando...' : 'Añadir tarea'}
        </button>
      </div>
      
      {/* Tabla de tareas */}
      <TaskTable
        title="Todas las Tareas"
        period="all"
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
