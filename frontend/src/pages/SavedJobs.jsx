import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Drop it straight away rather than reloading the whole list.
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
      <div className="jobs-container">
        {error && (
          <div style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {!loading && saved.length > 0 && (
          <p style={{ fontSize: 13, color: '#9090a8', margin: '0 0 16px' }}>
            {saved.length} saved {saved.length === 1 ? 'job' : 'jobs'}
          </p>
        )}

        <div className="jobs-grid">
          {loading ? (
            <div className="jobs-empty">Loading saved jobs...</div>
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
                <div key={row.id} style={{ position: 'relative' }}>
                  <JobCard
                    title={job.title}
                    company={job.company}
                    location={job.location || (job.is_remote ? 'Remote' : 'N/A')}
                    tags={tags}
                    matchScore={score}
                    isTopMatch={score != null && score >= 90}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    onMouseEnter={() => getJobDetail(job.id).catch(() => {})}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingRemove(row);
                    }}
                    title="Remove from saved"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(255,107,107,0.12)',
                      border: 'none',
                      borderRadius: 6,
                      color: '#e05260',
                      fontSize: 11,
                      padding: '4px 9px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          ) : (
            <div className="jobs-empty">
              No saved jobs yet. Open a job and press Save to keep it here.
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
