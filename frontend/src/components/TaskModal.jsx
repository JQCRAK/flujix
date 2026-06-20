import { useEffect } from 'react';
import { X } from 'lucide-react';
import TaskForm from './TaskForm.jsx';

export default function TaskModal({ initial, users = [], onSave, onClose }) {
  // Cerrar con tecla Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{initial ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <TaskForm initial={initial} users={users} onSave={onSave} onCancel={onClose} />
      </div>
    </div>
  );
}
