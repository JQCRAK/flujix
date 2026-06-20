import { Inbox } from 'lucide-react';
import TaskCard from './TaskCard.jsx';

export default function TaskList({
  tasks,
  currentUser,
  isAdmin,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <Inbox size={48} strokeWidth={1.25} />
        <p>No hay tareas</p>
        <span>
          {isAdmin ? 'Crea una nueva tarea para empezar' : 'Aún no tienes tareas asignadas'}
        </span>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task, i) => (
        <TaskCard
          key={task._id}
          task={task}
          currentUser={currentUser}
          isAdmin={isAdmin}
          animationDelay={Math.min(i, 8) * 45}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
