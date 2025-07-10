import TaskStatusBadge from "./TaskStatusBadge.tsx";
import ProgressBar from "./ProgressBar.tsx";
import RatingStars from "./RatingStars.tsx";
import type { Task } from "../types/task";

interface TaskRowProps {
  task: Task;
}

function TaskRow({ task }: TaskRowProps) {
  return (
    <tr className="border-b">
      <td className="py-2">{task.title}</td>

      <td>
        <div className="flex">
          {task.responsables.map((resp, i: number) => (
            <img
              key={i}
              src={resp.avatar}
              alt={resp.name}
              title={resp.name}
              className="w-8 h-8 rounded-full border-2 border-white -ml-2"
            />
          ))}
        </div>
      </td>

      <td>
        <TaskStatusBadge status={task.status} />
      </td>

      <td>
        <ProgressBar progress={task.progress} />
      </td>

      <td>
        <RatingStars rating={task.rating} />
      </td>
    </tr>
  );
}

export default TaskRow;
