export interface User {
  id: string; // UUID
  email: string;
  passwordHash: string;
  defaultTaskListId?: string; // UUID
  createdAt: string; // ISO
}

export type AuthenticatedUser = Omit<User, "passwordHash">;

export type TaskStatus = "incomplete" | "complete" | "pending";

export interface Task {
  id: string; // UUID
  taskListId: string; // UUID
  title: string; 
  description: string;
  status: TaskStatus;
  order: number;
  dueDate?: string | null; // ISO
  completedAt?: string | null; // ISO
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TaskList {
  id: string; // UUID
  name: string; // 1-255 chars
  ownerId: string; // UUID
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
