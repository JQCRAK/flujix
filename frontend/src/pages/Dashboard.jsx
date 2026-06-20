import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatsBar from '../components/StatsBar.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskModal from '../components/TaskModal.jsx';
import UsersPanel from '../components/UsersPanel.jsx';
import { api } from '../api.js';

const ADMIN_VIEWS = {
  dashboard: { title: 'Dashboard', subtitle: 'Stats globales del equipo' },
  tasks: { title: 'Tareas', subtitle: 'Todas las tareas de todos los usuarios' },
  users: { title: 'Usuarios', subtitle: 'Miembros registrados en Flujix' },
};

const USER_VIEWS = {
  all: { title: 'Todas las tareas', subtitle: 'Lo que está haciendo todo el equipo' },
  mine: { title: 'Mis tareas', subtitle: 'Tareas asignadas a ti' },
  done: { title: 'Completadas', subtitle: 'Tareas terminadas del equipo' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user.role === 'admin';
  const VIEWS = isAdmin ? ADMIN_VIEWS : USER_VIEWS;

  const [view, setView] = useState(isAdmin ? 'dashboard' : 'all');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [taskData, userData] = await Promise.all([
        api.list(),
        isAdmin ? api.users() : Promise.resolve([]),
      ]);
      setTasks(taskData);
      setUsers(userData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    // Admin ve stats globales; el usuario, las de sus propias tareas
    const scope = isAdmin ? tasks : tasks.filter((t) => t.assignedTo?._id === user.id);
    return {
      total: scope.length,
      pendiente: scope.filter((t) => t.status === 'pendiente').length,
      en_progreso: scope.filter((t) => t.status === 'en_progreso').length,
      completado: scope.filter((t) => t.status === 'completado').length,
    };
  }, [tasks, isAdmin, user.id]);

  const visibleTasks = useMemo(() => {
    if (view === 'mine') return tasks.filter((t) => t.assignedTo?._id === user.id);
    if (view === 'done') return tasks.filter((t) => t.status === 'completado');
    return tasks;
  }, [tasks, view, user.id]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSave(data) {
    try {
      if (editing) {
        await api.update(editing._id, data);
      } else {
        await api.create(data);
      }
      closeModal();
      await loadData();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(task, status) {
    try {
      await api.update(task._id, { status });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
    try {
      await api.remove(task._id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const { title, subtitle } = VIEWS[view];

  return (
    <div className="layout">
      <Sidebar
        view={view}
        onNavigate={setView}
        total={stats.total}
        isAdmin={isAdmin}
      />

      <main className="main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>

          <div className="header-actions">
            {isAdmin && (
              <button className="btn btn-primary btn-shimmer" onClick={openCreate}>
                <Plus size={16} />
                Nueva tarea
              </button>
            )}
            <div className="user-chip" title={user.email}>
              <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name}</span>
              <button
                className="icon-btn"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                onClick={logout}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="alert" role="alert">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {view === 'users' ? (
          <UsersPanel users={users} />
        ) : (
          <>
            <StatsBar stats={stats} />
            {loading ? (
              <div className="empty-state">
                <p>Cargando…</p>
              </div>
            ) : (
              <TaskList
                tasks={visibleTasks}
                currentUser={user}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            )}
          </>
        )}
      </main>

      {modalOpen && (
        <TaskModal
          initial={editing}
          users={users}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
