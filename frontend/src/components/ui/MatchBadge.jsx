export default function MatchBadge({ percentage, size = 48 }) {
  const hasScore = percentage !== null && percentage !== undefined && !Number.isNaN(Number(percentage));
  const value = hasScore ? Number(percentage) : 0;
  
  let color = '#71717a'; // zinc-500
  let trackColor = 'rgba(113, 113, 122, 0.15)';
  
  if (hasScore) {
    if (value >= 80) {
      color = '#10b981'; // Emerald
      trackColor = 'rgba(16, 185, 129, 0.15)';
    } else if (value >= 60) {
      color = '#7c3aed'; // Purple accent
      trackColor = 'rgba(124, 58, 237, 0.15)';
    } else {
      color = '#f59e0b'; // Amber warning
      trackColor = 'rgba(245, 158, 11, 0.15)';
    }
  }

  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasScore
    ? circumference - (value / 100) * circumference
    : circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold font-mono tracking-tight"
        style={{ color }}
      >
        {hasScore ? `${Math.round(value)}%` : '—'}
      </span>
    </div>
  );
}
