import { useState } from 'react';
import MatchBadge from './MatchBadge';
import { Sparkles, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatPostedDate } from '../../utils/formatDate';

export default function JobCard({
  title,
  company,
  location,
  tags = [],
  matchScore,
  datePosted,
  isTopMatch = false,
  isSaved = false,
  onSaveToggle,
  onClick,
  onMouseEnter,
}) {
  const [savedState, setSavedState] = useState(isSaved);
  const formattedDate = formatPostedDate(datePosted);

  const getInitials = (name) => {
    if (!name) return 'CO';
    const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    setSavedState((prev) => !prev);
    if (onSaveToggle) {
      onSaveToggle(!savedState);
    }
  };

  return (
    <div
      className={`glass-card p-5 cursor-pointer flex items-center justify-between gap-4 relative overflow-hidden transition-all duration-200 hover:scale-[1.015] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-950/20 group ${
        isTopMatch ? 'border-purple-500/30 bg-purple-950/10 shadow-lg shadow-purple-950/20' : ''
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {isTopMatch && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none rounded-bl-full" />
      )}

      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* 2-Letter Gradient Circle Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md border border-purple-400/30 shrink-0">
          {getInitials(company)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-100 group-hover:text-purple-300 transition-colors truncate">
              {title}
            </h3>
            {isTopMatch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Top Match
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 font-medium truncate">
            {company} <span className="text-zinc-600">•</span> {location}
            {formattedDate && (
              <>
                <span className="text-zinc-600"> • </span>
                <span className="text-purple-400/90 font-semibold">{formattedDate}</span>
              </>
            )}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => {
              const tagLower = tag.toLowerCase();
              let badgeStyle = 'bg-white/5 text-zinc-300 border-white/10';

              if (tagLower === 'remote') {
                badgeStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              } else if (tagLower.includes('full-time') || tagLower.includes('full time')) {
                badgeStyle = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
              } else if (tagLower.includes('freelance')) {
                badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              } else if (tagLower.includes('contract') || tagLower.includes('internship')) {
                badgeStyle = 'bg-orange-500/15 text-orange-300 border-orange-500/30';
              } else if (tagLower.includes('jobspy') || tagLower.includes('arbeitnow') || tagLower.includes('indeed') || tagLower.includes('linkedin')) {
                // Source badge as gray monospace pill
                badgeStyle = 'font-mono text-[10px] bg-zinc-800/80 text-zinc-400 border-zinc-700/60';
              }

              return (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {onSaveToggle && (
          <button
            type="button"
            onClick={handleSaveClick}
            className={`p-2 rounded-xl border transition-all ${
              savedState
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-950/30'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-amber-300 hover:bg-white/10'
            }`}
            title={savedState ? 'Saved' : 'Save job'}
          >
            {savedState ? (
              <BookmarkCheck className="w-4 h-4 fill-amber-400 text-amber-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        )}

        <MatchBadge percentage={matchScore} />
      </div>
    </div>
  );
}
