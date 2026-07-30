import './MatchBadge.css';

export default function MatchBadge({ percentage, size = 44 }) {
  const hasScore = percentage !== null && percentage !== undefined && !Number.isNaN(Number(percentage));
  const value = hasScore ? Number(percentage) : 0;
  const isHigh = value >= 70;
  const color = hasScore ? (isHigh ? '#7c6ff7' : '#6b6b80') : '#6b6b80';
  const trackColor = isHigh ? 'rgba(124, 111, 247, 0.15)' : 'rgba(107, 107, 128, 0.15)';

  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasScore
    ? circumference - (value / 100) * circumference
    : circumference;

  return (
    <div className="match-badge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={3}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span
        className="match-badge-text"
        style={{ color }}
      >
        {hasScore ? `${Math.round(value)}%` : '—'}
      </span>
    </div>
  );
}
