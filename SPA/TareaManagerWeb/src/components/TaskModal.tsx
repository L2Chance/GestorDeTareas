import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { Task, TaskPriority, TaskStatus } from "../types/task";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id">) => void;
  initialData?: Partial<Omit<Task, "id">>;
}

const statusOptions: TaskStatus[] = ["Listo", "En curso", "En revisión", "Pendiente"];
const priorityOptions: TaskPriority[] = ["Baja", "Media", "Alta"];

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}
function getMaxDateISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

export default function TaskModal({ open, onClose, onSave, initialData }: TaskModalProps) {
  const [titulo, setTitulo] = useState(initialData?.title || "");
  const [descripcion, setDescripcion] = useState(initialData?.description || "");
  const [status, setStatus] = useState<TaskStatus>(initialData?.status || "En curso");
  const [fechaCompletada, setFechaCompletada] = useState(initialData?.dueDate || "");
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || "Media");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    onSave({
      title: titulo,
      description: descripcion,
      responsables: [{ name: "Usuario", avatar: "https://via.placeholder.com/32" }], // Por defecto
      status,
      dueDate: fechaCompletada,
      priority,
    });
    onClose();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold mb-4">{initialData ? "Editar Tarea" : "Nueva Tarea"}</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input 
                    type="text" 
                    className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea 
                    className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={descripcion} 
                    onChange={e => setDescripcion(e.target.value)} 
                    rows={3}
                    required 
                  />
                </div>
                {/* Estado solo en edición */}
                {initialData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select className="mt-1 w-full border rounded-md px-3 py-2" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                      {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                    <select className="mt-1 w-full border rounded-md px-3 py-2" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                      {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha límite</label>
                  <input 
                    type="date" 
                    className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={fechaCompletada} 
                    onChange={e => setFechaCompletada(e.target.value)} 
                    required 
                    min={getTodayISO()} 
                    max={getMaxDateISO()} 
                  />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar</button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 