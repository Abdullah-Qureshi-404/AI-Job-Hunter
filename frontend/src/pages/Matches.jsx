import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import JobCard from '../components/ui/JobCard';
import { getMatches, getJobDetail } from '../services/jobsApi';
import { parseApiError } from '../services/api';

const PAGE_SIZE = 10;

export default function Matches() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [matches, setMatches] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    getMatches({ page })
      .then(({ results, count: total }) => {
        if (!isMounted) return;
        setMatches(results);
        setCount(total);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load matches:', err);
        setError(parseApiError(err) || 'Could not load your matched jobs.');
      })
      .finally(() => isMounted && setLoading(false));

    return () => {
      isMounted = false;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <MainLayout title="Matched Jobs">
      <div className="space-y-6">
        {!loading && count > 0 && (
          <p className="text-xs text-zinc-400 font-medium">
            <span className="text-zinc-200 font-bold">{count}</span> matched {count === 1 ? 'job' : 'jobs'} · scores are calculated by ApplyAI comparing your profile skills with job titles and descriptions
          </p>
        )}

        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="glass-card p-12 text-center text-zinc-400 text-sm">
              Loading matches...
            </div>
          ) : matches.length > 0 ? (
            matches.map((item) => {
              const job = item.job || item;
              const score = item.match_score != null ? Math.round(item.match_score) : null;

              const tags = [];
              if (job.is_remote) tags.push('Remote');
              if (job.job_type) tags.push(job.job_type);
              if (job.source) tags.push(job.source);

              return (
                <JobCard
                  key={item.id || job.id}
                  title={job.title}
                  company={job.company}
                  location={job.location || (job.is_remote ? 'Remote' : 'N/A')}
                  tags={tags}
                  matchScore={score}
                  isTopMatch={score != null && score >= 85}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  onMouseEnter={() => getJobDetail(job.id).catch(() => {})}
                />
              );
            })
          ) : (
            <div className="glass-card p-12 text-center text-zinc-500 text-sm">
              No matched jobs yet. Upload a resume, add skills to your profile,
              then refresh matches from the Dashboard.
            </div>
          )}
        </div>

        {!loading && !error && count > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-4 pt-4 text-xs text-zinc-400">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg font-semibold bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span className="font-medium">Page {page} of {totalPages} · <span className="text-zinc-300 font-bold">{count}</span> matches</span>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg font-semibold bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
