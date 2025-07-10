import { useEffect, useState } from "react";

interface Responsable {
  name: string;
  avatar?: string;
}

interface Task {
  id: number | string;
  title: string;
  description: string;
  responsables: Responsable[];
  status: string;
  dueDate: string;
  priority: string;
}

export default function TaskDetail() {
  // Extraer el id de la URL manualmente
  const path = window.location.pathname; // Ej: /tareas/7
  const id = path.split("/").pop();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("ID de tarea no válido");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`https://gestordetareas-hodt.onrender.com/api/Tareas/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo obtener la tarea");
        const data = await res.json();
        setTask(data);
      })
      .catch(() => setError("No se pudo cargar la tarea"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setQrLoading(true);
    setQrError("");
    setQrUrl(null);
    fetch(`https://gestordetareas-hodt.onrender.com/api/Tareas/${id}/qr`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo obtener el QR");
        const blob = await res.blob();
        setQrUrl(URL.createObjectURL(blob));
      })
      .catch(() => setQrError("No se pudo cargar el QR"))
      .finally(() => setQrLoading(false));
    return () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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
    );
  }
  if (error) {
    return <div className="text-red-600 text-center mt-8">{error}</div>;
  }
  if (!task) {
    return (
      <div className="text-gray-500 text-center mt-8">
        No se encontró la tarea
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 mt-10">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">{task.title}</h1>
      <p className="text-gray-700 mb-4 text-base whitespace-pre-line border-l-4 border-blue-200 pl-3 bg-blue-50 rounded">
        {task.description}
      </p>
      <div className="flex flex-col gap-2 mb-4">
        <div>
          <span className="font-semibold text-gray-600">Responsables:</span>{" "}
          {task.responsables?.map((r) => r.name).join(", ")}
        </div>
        <div>
          <span className="font-semibold text-gray-600">Estado:</span>{" "}
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-semibold 
            ${
              task.status === "Listo"
                ? "bg-green-100 text-green-700"
                : task.status === "En curso"
                ? "bg-yellow-100 text-yellow-700"
                : task.status === "En revisión"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {task.status}
          </span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Fecha límite:</span>{" "}
          {task.dueDate}
        </div>
        <div>
          <span className="font-semibold text-gray-600">Prioridad:</span>{" "}
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-semibold 
            ${
              task.priority === "Alta"
                ? "bg-red-100 text-red-700"
                : task.priority === "Media"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {task.priority}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 mt-6">
        <span className="font-semibold text-gray-600 mb-1">
          Código QR de la tarea:
        </span>
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
            className="h-32 w-32 object-contain border rounded bg-gray-50"
          />
        ) : null}
      </div>
    </div>
  );
}
