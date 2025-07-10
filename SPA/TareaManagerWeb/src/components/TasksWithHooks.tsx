import React from 'react';
import { useApi, useCrudApi } from '../hooks/useApi';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasksApi';
import LoadingSpinner from './LoadingSpinner';

const TasksWithHooks: React.FC = () => {
  // Hook personalizado para obtener tareas
  const { 
    data: tasks, 
    loading: tasksLoading, 
    error: tasksError, 
    execute: refetchTasks 
  } = useApi(fetchTasks);

  // Hook para operaciones CRUD
  const { 
    create, 
    update, 
    remove, 
    loading: crudLoading, 
    error: crudError 
  } = useCrudApi('http://localhost:5000/api/tareas');

  const handleCreateTask = async () => {
    try {
      const newTask = {
        title: 'Nueva tarea desde hooks',
        description: 'Esta tarea fue creada usando hooks personalizados',
        status: 'Pendiente',
        priority: 'Media',
        dueDate: '2024-12-31'
      };
      
      await create(newTask);
      // Recargar la lista después de crear
      refetchTasks();
    } catch (error) {
      console.error('Error al crear tarea:', error);
    }
  };

  const handleUpdateTask = async (taskId: number) => {
    try {
      const updatedTask = {
        title: 'Tarea actualizada',
        description: 'Esta tarea fue actualizada',
        status: 'En curso',
        priority: 'Alta',
        dueDate: '2024-12-25'
      };
      
      await update(taskId, updatedTask);
      refetchTasks();
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await remove(taskId);
      refetchTasks();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  };

  if (tasksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error al cargar tareas</h3>
        <p className="text-red-600">{tasksError}</p>
        <button 
          onClick={refetchTasks}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tareas usando Hooks Personalizados</h2>
        <button 
          onClick={handleCreateTask}
          disabled={crudLoading}
          className="btn-primary disabled:opacity-50"
        >
          {crudLoading ? 'Creando...' : 'Crear Tarea'}
        </button>
      </div>

      {crudError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{crudError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {tasks && tasks.length > 0 ? (
          tasks.map((task: any) => (
            <div key={task.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{task.titulo}</h3>
                  <p className="text-gray-600 text-sm">{task.descripcion}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Prioridad: {task.prioridad}</span>
                    <span>Estado: {task.completada ? 'Completada' : 'Pendiente'}</span>
                    {task.fechaLimite && (
                      <span>Límite: {new Date(task.fechaLimite).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateTask(task.id)}
                    disabled={crudLoading}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={crudLoading}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay tareas disponibles
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksWithHooks; 