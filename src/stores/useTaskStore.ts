import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Task, TaskList } from "../types";
import api from "../lib/api";

interface TaskState {
  taskLists: TaskList[];
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTaskLists: (userId: string) => Promise<void>;
  fetchTasks: (taskListId: string) => Promise<void>;
  addTask: (taskData: {
    taskListId: string;
    title: string;
    description: string;
  }) => Promise<void>;
  updateTask: (
    taskId: string,
    updates: Partial<Omit<Task, "id">>
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reorderTasks: (taskListId: string, orderedTaskIds: string[]) => Promise<void>;
  clearStore: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      taskLists: [],
      tasks: [],
      loading: false,
      error: null,
      fetchTaskLists: async (userId) => {
        const hasTaskLists = get().taskLists.length > 0;
        if (!hasTaskLists) {
          set({ loading: true });
        }
        set({ error: null });
        try {
          const response = await api.get(`/users/${userId}/tasklists`);
          set({ taskLists: response.data, loading: false });
        } catch {
          set({ error: "Failed to fetch task lists", loading: false });
        }
      },
      fetchTasks: async (taskListId) => {
        const hasTasks = get().tasks.some((t) => t.taskListId === taskListId);
        if (!hasTasks) {
          set({ loading: true });
        }
        set({ error: null });
        try {
          const response = await api.get(`/tasklists/${taskListId}/tasks`);
          const existingTasks = get().tasks.filter(
            (t) => t.taskListId !== taskListId
          );
          set({ tasks: [...existingTasks, ...response.data], loading: false });
        } catch {
          set({ error: "Failed to fetch tasks", loading: false });
        }
      },
      addTask: async (taskData) => {
        try {
          const response = await api.post("/tasks", taskData);
          const newTask = response.data;
          set((state) => ({
            tasks: [...state.tasks, newTask],
          }));
        } catch (err) {
          set({ error: "Failed to add task" });
          throw err;
        }
      },
      updateTask: async (taskId, updates) => {
        const originalTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
        try {
          const response = await api.patch(`/tasks/${taskId}`, updates);
          const updatedTask = response.data;
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId ? updatedTask : task
            ),
          }));
        } catch (err) {
          set({ error: "Failed to update task", tasks: originalTasks });
          throw err;
        }
      },
      deleteTask: async (taskId) => {
        const originalTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        }));
        try {
          await api.delete(`/tasks/${taskId}`);
        } catch (err) {
          set({ error: "Failed to delete task", tasks: originalTasks });
          throw err;
        }
      },
      reorderTasks: async (taskListId, orderedTaskIds) => {
        const originalTasks = get().tasks;

        const updatedTasks = get().tasks.map((task) => {
          const newOrder = orderedTaskIds.indexOf(task.id);
          if (task.taskListId === taskListId && newOrder !== -1) {
            return {
              ...task,
              order: newOrder,
              updatedAt: new Date().toISOString(),
            };
          }
          return task;
        });

        set({ tasks: updatedTasks.sort((a, b) => a.order - b.order) });

        try {
          await api.post("/tasks/reorder", { taskListId, orderedTaskIds });
        } catch (err) {
          set({ error: "Failed to reorder tasks", tasks: originalTasks });
          throw err;
        }
      },
      clearStore: () =>
        set({ taskLists: [], tasks: [], error: null, loading: false }),
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        taskLists: state.taskLists,
      }),
    }
  )
);
