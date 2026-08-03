import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkX, Trash2, ArrowRight } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import JobCard from '../components/ui/JobCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getSavedJobs, unsaveJob } from '../services/savedJobs';
import { getJobDetail } from '../services/jobsApi';
import { parseApiError } from '../services/api';

export default function SavedJobs() {
  const navigate = useNavigate();

  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSavedJobs()
      .then((rows) => isMounted && setSaved(rows))
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load saved jobs:', err);
          setError(parseApiError(err) || 'Could not load your saved jobs.');
        }
      })
      .finally(() => isMounted && setLoading(false));

    return () => {
      isMounted = false;
    };
  }, []);

  const confirmRemove = async () => {
    if (!pendingRemove) return;

    const jobId = pendingRemove.job.id;
    const previous = saved;

    setRemoving(true);
    setSaved((rows) => rows.filter((row) => row.job?.id !== jobId));

    try {
      await unsaveJob(jobId);
      setPendingRemove(null);
    } catch (err) {
      console.error('Failed to remove saved job:', err);
      setSaved(previous);
      setError(parseApiError(err) || 'Could not remove that saved job.');
      setPendingRemove(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <MainLayout title="Saved Jobs">
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {!loading && saved.length > 0 && (
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium px-1">
            <span>
              Showing <span className="text-zinc-100 font-bold">{saved.length}</span> saved {saved.length === 1 ? 'job' : 'jobs'}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="glass-card p-12 text-center text-zinc-400 text-sm">
              Loading saved jobs...
            </div>
          ) : saved.length > 0 ? (
            saved.map((row) => {
              const job = row.job;
              if (!job) return null;

              const tags = [];
              if (job.is_remote) tags.push('Remote');
              if (job.job_type) tags.push(job.job_type);
              if (job.source) tags.push(job.source);

              const score = job.match_score != null ? Math.round(job.match_score) : null;

              return (
                <div key={row.id} className="relative group">
                  <JobCard
                    title={job.title}
                    company={job.company}
                    location={job.location || (job.is_remote ? 'Remote' : 'N/A')}
                    tags={tags}
                    matchScore={score}
                    isTopMatch={score != null && score >= 90}
                    isSaved={true}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    onMouseEnter={() => getJobDetail(job.id).catch(() => {})}
                  />
                  {/* Red Ghost Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingRemove(row);
                    }}
                    title="Remove from saved"
                    className="absolute top-4 right-16 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/40 transition-all opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              );
            })
          ) : (
            /* ILLUSTRATED EMPTY STATE CARD */
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-950/30 mb-2">
                <BookmarkX className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">No saved jobs yet</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bookmark positions while browsing jobs to easily review and apply to them later.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 transition-all"
              >
                Browse Jobs
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove saved job?"
        message={
          pendingRemove
            ? `"${pendingRemove.job?.title}" will be removed from your saved list. The listing itself is not affected.`
            : ''
        }
        confirmLabel="Remove"
        busy={removing}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </MainLayout>
  );
}
