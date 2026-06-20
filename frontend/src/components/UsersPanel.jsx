import { Users, ShieldCheck } from 'lucide-react';

export default function UsersPanel({ users }) {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <Users size={48} strokeWidth={1.25} />
        <p>No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="users-table-wrap">
      <table className="users-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Fecha de registro</th>
            <th>Tareas</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="user-cell">
                  <span className="user-avatar">{u.name.charAt(0).toUpperCase()}</span>
                  <span>{u.name}</span>
                  {u.role === 'admin' && (
                    <span className="badge badge-admin">
                      <ShieldCheck size={11} />
                      Admin
                    </span>
                  )}
                </div>
              </td>
              <td className="cell-secondary">{u.email}</td>
              <td className="cell-secondary">
                {new Date(u.createdAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td>
                <span className="badge">{u.taskCount}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
