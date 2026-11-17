import { api } from '../api/client.ts';
import { toast } from '../ui/toast.ts';
import type { Task } from './types.ts';

export const addTask = async (title: string): Promise<Task> => {
	const task = await api.post<Task>('/tasks', { title, status: 'TODO' });
	toast.success(`"${title}" was added to your TODO list.`);
	return task;
};
