import type { TaskStatus } from "../types/task";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const colors: Record<TaskStatus, string> = {
    Listo: "bg-green-500",
    "En curso": "bg-yellow-500",
    "En revisión": "bg-blue-500",
    Pendiente: "bg-gray-500",
  };

  return (
    <span className={`text-white text-sm px-2 py-1 rounded ${colors[status]}`}>
      {status}
    </span>
  );
}

export default TaskStatusBadge;
