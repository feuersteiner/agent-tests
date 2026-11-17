import type { Task } from './types.ts';

/**
 * Orders tasks by due date, undated tasks last.
 * TODO: sort by priority once tasks have one.
 */
export const sortTasks = (tasks: Task[]): Task[] =>
	[...tasks].sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
