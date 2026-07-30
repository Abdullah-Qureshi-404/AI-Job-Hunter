import MatchBadge from './MatchBadge';
import './JobCard.css';

export default function JobCard({
  title,
  company,
  location,
  tags = [],
  matchScore,
  isTopMatch = false,
  onClick,
  onMouseEnter,
}) {
  return (
    <div
      className={`job-card${isTopMatch ? ' job-card--top-match' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="job-card-content">
        <div className="job-card-header">
          <h3 className="job-card-title">{title}</h3>
          {isTopMatch && <span className="job-card-top-label">Top Match</span>}
        </div>
        <p className="job-card-company">{company} · {location}</p>
        <div className="job-card-meta">
          {tags.map((tag) => {
            let tagClass = 'job-card-tag job-card-tag--default';
            if (tag.toLowerCase() === 'remote') tagClass = 'job-card-tag job-card-tag--remote';
            if (tag.toLowerCase().includes(',') || /^[a-z]+,?\s/i.test(tag)) {
              tagClass = 'job-card-tag job-card-tag--location';
            }
            return (
              <span key={tag} className={tagClass}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>
      <div className="job-card-match">
        <MatchBadge percentage={matchScore} />
      </div>
    </div>
  );
}
