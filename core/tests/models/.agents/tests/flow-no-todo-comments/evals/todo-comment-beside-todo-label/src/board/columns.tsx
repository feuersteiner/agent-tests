import { Column } from './column.tsx';
import type { Task } from '../tasks/types.ts';

export const Board = ({ tasks }: { tasks: Task[] }) => (
	<div className="board">
		{/* TODO: let users rename and reorder columns */}
		<Column title="TODO" tasks={tasks.filter((task) => task.status === 'todo')} />
		<Column title="In progress" tasks={tasks.filter((task) => task.status === 'doing')} />
		<Column title="Done" tasks={tasks.filter((task) => task.status === 'done')} />
	</div>
);
