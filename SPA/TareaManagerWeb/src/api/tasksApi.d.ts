import type { Task, TareaApi } from "../types/task";

export declare const fetchTasks: () => Promise<TareaApi[]>;
export declare const createTask: (task: Omit<Task, "id">) => Promise<Task>;
export declare const updateTask: (
  id: string,
  task: Partial<Task>
) => Promise<Task>;
export declare const deleteTask: (id: string) => Promise<void>;
export declare const getTasksByPeriod: (period: string) => Promise<Task[]>;
export declare const convertApiTaskToFrontendTask: (apiTask: TareaApi) => Task;
