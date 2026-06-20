import {
  ClipboardList,
  LayoutDashboard,
  ListTodo,
  CheckCircle2,
  Users,
  User,
} from 'lucide-react';

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tareas', icon: ListTodo },
  { id: 'users', label: 'Usuarios', icon: Users },
];

const USER_NAV = [
  { id: 'all', label: 'Todas las tareas', icon: ListTodo },
  { id: 'mine', label: 'Mis tareas', icon: User },
  { id: 'done', label: 'Completadas', icon: CheckCircle2 },
];

export default function Sidebar({ view, onNavigate, total, isAdmin }) {
  const items = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">
          <ClipboardList size={18} />
        </span>
        <span className="logo-text">Flujix</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${view === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="stats-badge">
          <span className="stats-badge-count">{total}</span>
          <span className="stats-badge-label">
            {isAdmin
              ? total === 1
                ? 'tarea total'
                : 'tareas totales'
              : total === 1
                ? 'tarea asignada'
                : 'tareas asignadas'}
          </span>
        </div>
      </div>
    </aside>
  );
}
