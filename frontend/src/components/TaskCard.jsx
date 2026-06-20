import {
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Edit2,
  Trash2,
  ChevronRight,
  UserCircle2,
} from 'lucide-react';

const STATUS = {
  pendiente: { label: 'Pendiente', className: 'badge-pending' },
  en_progreso: { label: 'En progreso', className: 'badge-progress' },
  completado: { label: 'Completado', className: 'badge-done' },
};

const PRIORITY = {
  baja: { label: 'Baja', icon: ArrowDown, className: 'priority-low' },
  media: { label: 'Media', icon: Minus, className: 'priority-mid' },
  alta: { label: 'Alta', icon: ArrowUp, className: 'priority-high' },
};

// Siguiente estado en el flujo pendiente → en_progreso → completado
const NEXT_STATUS = {
  pendiente: 'en_progreso',
  en_progreso: 'completado',
  completado: 'pendiente',
};

export default function TaskCard({
  task,
  currentUser,
  isAdmin,
  animationDelay = 0,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const status = STATUS[task.status];
  const priority = PRIORITY[task.priority];
  const PriorityIcon = priority.icon;
  const nextLabel = STATUS[NEXT_STATUS[task.status]].label;

  const isMine = task.assignedTo?._id === currentUser.id;
  const canAdvance = isAdmin || isMine;
  const assigneeName = task.assignedTo?.name || 'Sin asignar';

  const created = new Date(task.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article
      className={`task-card ${task.status === 'completado' ? 'is-done' : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="task-card-main">
        <div className="task-badges">
          <span className={`badge ${status.className}`}>
            <span
              className={`badge-dot ${task.status === 'en_progreso' ? 'pulse' : ''}`}
            />
            {status.label}
          </span>
          <span className={`badge badge-priority ${priority.className}`}>
            <PriorityIcon size={12} />
            {priority.label}
          </span>
          <span className={`badge badge-assignee ${isMine ? 'is-me' : ''}`}>
            <UserCircle2 size={12} />
            {isMine ? 'Asignada a ti' : `Asignado a: ${assigneeName}`}
          </span>
        </div>

        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}

        <div className="task-meta">
          <Calendar size={13} />
          <span>{created}</span>
        </div>
      </div>

      <div className="task-card-actions">
        {isAdmin && (
          <div className="hover-actions">
            <button
              className="icon-btn"
              title="Editar"
              aria-label="Editar tarea"
              onClick={() => onEdit(task)}
            >
              <Edit2 size={15} />
            </button>
            <button
              className="icon-btn icon-btn-danger"
              title="Eliminar"
              aria-label="Eliminar tarea"
              onClick={() => onDelete(task)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}

        {canAdvance && (
          <button
            className="btn btn-ghost btn-advance"
            title={`Pasar a ${nextLabel}`}
            onClick={() => onStatusChange(task, NEXT_STATUS[task.status])}
          >
            {nextLabel}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
