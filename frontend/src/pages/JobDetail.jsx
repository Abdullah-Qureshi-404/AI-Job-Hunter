import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice,
  HiOutlineMapPin,
  HiOutlineCurrencyDollar,
  HiOutlineBookmark,
  HiBookmark,
  HiCheckCircle,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';
import MainLayout from '../components/layout/MainLayout';
import MatchBadge from '../components/ui/MatchBadge';
import JobDescription from '../components/ui/JobDescription';
import { getSavedJobs, toggleSavedJob } from '../services/savedJobs';
import { getJobDetail } from '../services/jobsApi';
import './JobDetail.css';

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  const handleToggleSave = async () => {
    setSavingBookmark(true);
    // Flip immediately; revert if the request fails.
    const previous = isSaved;
    setIsSaved(!previous);

    try {
      const nowSaved = await toggleSavedJob(id, previous);
      setIsSaved(nowSaved);
    } catch (err) {
      console.error('Could not update saved job:', err);
      setIsSaved(previous);
    } finally {
      setSavingBookmark(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      setError('Invalid or missing Job ID.');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getJobDetail(id);
        if (isMounted) {
          setJob(data);
        }

        // Cached after the first call, so this is usually free.
        try {
          const saved = await getSavedJobs();
          if (isMounted) {
            setIsSaved(saved.some((item) => String(item.job?.id) === String(id)));
          }
        } catch {
          /* bookmark state is non-critical */
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error fetching job detail for ID ${id}:`, err);
          setError('Failed to load job details. The job listing may not exist.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <MainLayout title="Job Details">
        <div className="jobdetail-container">
          <button
            type="button"
            className="jobdetail-back-btn"
            onClick={() => navigate('/jobs')}
          >
            <HiOutlineArrowLeft /> ← Back to jobs
          </button>
          <div className="jobdetail-card" style={{ textAlign: 'center', color: '#9090a8', padding: '60px 20px' }}>
            Loading job details...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !job) {
    return (
      <MainLayout title="Job Details">
        <div className="jobdetail-container">
          <button
            type="button"
            className="jobdetail-back-btn"
            onClick={() => navigate('/jobs')}
          >
            <HiOutlineArrowLeft /> ← Back to jobs
          </button>
          <div className="jobdetail-card" style={{ textAlign: 'center', color: '#ff6b6b', padding: '60px 20px' }}>
            {error || 'Job not found.'}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Format salary
  let salaryText = 'Competitive';
  if (job.salary_min || job.salary_max) {
    const symbol = job.currency === 'USD' || !job.currency ? '$' : `${job.currency} `;
    if (job.salary_min && job.salary_max) {
      const minK = Math.round(job.salary_min / 1000);
      const maxK = Math.round(job.salary_max / 1000);
      salaryText = `${symbol}${minK}k-${maxK}k`;
    } else {
      const valK = Math.round((job.salary_min || job.salary_max) / 1000);
      salaryText = `${symbol}${valK}k`;
    }
  }

  // Requirements exactly as scraped. We deliberately do not split these into
  // "matched" and "unmatched" - nothing here is compared against the user's
  // skills, so any such split would be invented.
  const hasRequirements = typeof job.requirements === 'string'
    && job.requirements.trim().length > 0;

  return (
    <MainLayout title="Job Details">
      <div className="jobdetail-container">
        {/* Back Button */}
        <button
          type="button"
          className="jobdetail-back-btn"
          onClick={() => navigate('/jobs')}
        >
          <HiOutlineArrowLeft /> ← Back to jobs
        </button>

        {/* Header Card */}
        <div className="jobdetail-header-card">
          <div className="jobdetail-header-main">
            <h1 className="jobdetail-title">{job.title}</h1>
            <div className="jobdetail-meta-row">
              <span className="jobdetail-meta-item">
                <HiOutlineBuildingOffice className="jobdetail-meta-icon" /> {job.company}
              </span>
              <span className="jobdetail-meta-item">
                <HiOutlineMapPin className="jobdetail-meta-icon" /> {job.location || job.country || 'Remote'}
              </span>
              {job.is_remote && <span className="jobdetail-badge-remote">Remote</span>}
              <span className="jobdetail-meta-item">
                <HiOutlineCurrencyDollar className="jobdetail-meta-icon" /> {salaryText}
              </span>
            </div>

            <div className="jobdetail-actions">
              <button
                type="button"
                className="jobdetail-btn-apply"
                onClick={() => navigate(`/apply/${id}`)}
              >
                Build Resume &amp; Email
              </button>
              <button
                type="button"
                className={`jobdetail-btn-save${isSaved ? ' saved' : ''}`}
                disabled={savingBookmark}
                onClick={handleToggleSave}
              >
                {isSaved ? <HiBookmark /> : <HiOutlineBookmark />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
              {job.source_url && (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="jobdetail-btn-save"
                  style={{ textDecoration: 'none' }}
                >
                  <HiArrowTopRightOnSquare /> Apply Link
                </a>
              )}
            </div>
          </div>

          <MatchBadge percentage={job.match_score ?? null} size={64} />
        </div>

        {/* Requirements - hidden entirely when the listing has none, rather
            than showing an empty card on the majority of jobs. */}
        {hasRequirements && (
          <div className="jobdetail-card">
            <h2 className="jobdetail-section-title">Requirements</h2>
            <JobDescription text={job.requirements} emptyMessage="" />
          </div>
        )}

        {/* Job Description Card */}
        <div className="jobdetail-card">
          <h2 className="jobdetail-section-title">Job Description</h2>
          {/* description_formatted is the LLM-restructured copy produced
              offline by `manage.py format_descriptions`. Its wording is
              verified identical to the original; fall back when absent. */}
          <JobDescription
            text={job.description_formatted || job.description}
            emptyMessage="No detailed description provided for this position."
          />
        </div>
      </div>
    </MainLayout>
  );
}
