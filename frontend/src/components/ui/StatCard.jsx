export default function StatCard({ label, value, accentColor = '#7c3aed' }) {
  return (
    <div
      className="glass-card glass-card-hover p-5 relative overflow-hidden group"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      <div
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none group-hover:opacity-25 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
        {value}
      </p>
    </div>
  );
}
