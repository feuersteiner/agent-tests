export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
	TODO: 'IN_PROGRESS',
	IN_PROGRESS: 'DONE',
	DONE: 'DONE'
};

export const advance = (status: TaskStatus): TaskStatus => NEXT_STATUS[status];
