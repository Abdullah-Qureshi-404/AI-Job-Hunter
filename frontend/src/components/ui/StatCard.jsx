import './StatCard.css';

export default function StatCard({ label, value, accentColor = '#7c6ff7' }) {
  return (
    <div
      className="stat-card"
      style={{ '--accent': accentColor }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2a3a'}
    >
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value" style={{ color: accentColor }}>{value}</p>
    </div>
  );
}
