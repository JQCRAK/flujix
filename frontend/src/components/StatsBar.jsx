import { Circle, Clock, CheckCircle2 } from 'lucide-react';

const CARDS = [
  { key: 'pendiente', label: 'Pendientes', icon: Circle, className: 'stat-pending' },
  { key: 'en_progreso', label: 'En progreso', icon: Clock, className: 'stat-progress' },
  { key: 'completado', label: 'Completadas', icon: CheckCircle2, className: 'stat-done' },
];

export default function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      {CARDS.map(({ key, label, icon: Icon, className }) => (
        <div key={key} className={`stat-card ${className}`}>
          <div className="stat-icon">
            <Icon size={18} />
          </div>
          <div>
            <div className="stat-value">{stats[key]}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
