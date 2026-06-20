import { useState } from 'react';

export default function TaskForm({ initial, users = [], onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState(initial?.priority || 'media');
  const [status, setStatus] = useState(initial?.status || 'pendiente');
  const [assignedTo, setAssignedTo] = useState(
    initial?.assignedTo?._id || users[0]?.id || ''
  );

  const isEditing = Boolean(initial);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assignedTo,
    });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="task-title">Título</label>
        <input
          id="task-title"
          type="text"
          placeholder="¿Qué hay que hacer?"
          value={title}
          maxLength={100}
          required
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
        />
        <span className="form-hint">{title.length}/100</span>
      </div>

      <div className="form-field">
        <label htmlFor="task-description">Descripción</label>
        <textarea
          id="task-description"
          placeholder="Detalles adicionales (opcional)"
          value={description}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="task-assignee">Asignar a</label>
        <select
          id="task-assignee"
          value={assignedTo}
          required
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="" disabled>
            Selecciona un usuario
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="task-priority">Prioridad</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="task-status">Estado</label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Guardar cambios' : 'Crear tarea'}
        </button>
      </div>
    </form>
  );
}
