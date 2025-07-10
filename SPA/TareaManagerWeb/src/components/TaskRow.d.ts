import { FC } from "react";
import type { Task } from "../types/task";

interface TaskRowProps {
  task: Task;
}

declare const TaskRow: FC<TaskRowProps>;
export default TaskRow;
