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
  HiXCircle,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';
import MainLayout from '../components/layout/MainLayout';
import MatchBadge from '../components/ui/MatchBadge';
import { getJobDetail } from '../services/jobsApi';
import './JobDetail.css';

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

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

  // Extract skills from requirements or fallback to defaults
  let matchedSkills = ['Python', 'Django', 'PostgreSQL', 'REST APIs'];
  let unmatchedSkills = ['AWS', 'Docker', 'Redis'];

  if (job.requirements && typeof job.requirements === 'string') {
    const parsed = job.requirements.split(/[,;•\n]/).map(s => s.trim()).filter(Boolean);
    if (parsed.length > 0) {
      const splitIdx = Math.max(1, Math.ceil(parsed.length * 0.6));
      matchedSkills = parsed.slice(0, splitIdx);
      unmatchedSkills = parsed.slice(splitIdx);
    }
  }

  // Parse responsibilities or split description
  let responsibilities = [
    'Design, build, and maintain efficient, reusable, and reliable Python code.',
    'Architect and implement scalable backend APIs that handle sub-second latency.',
    'Collaborate with cross-functional product and engineering teams.',
    'Optimize database queries and schema designs to ensure high throughput.',
    'Participate in code reviews and drive engineering best practices.',
  ];

  if (job.description && typeof job.description === 'string') {
    const sentences = job.description
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
    if (sentences.length >= 3) {
      responsibilities = sentences.slice(0, 5);
    }
  }

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
                Apply Now
              </button>
              <button
                type="button"
                className={`jobdetail-btn-save${isSaved ? ' saved' : ''}`}
                onClick={() => setIsSaved(!isSaved)}
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
                  <HiArrowTopRightOnSquare /> Source
                </a>
              )}
            </div>
          </div>

          <MatchBadge percentage={job.match_score || 94} size={64} />
        </div>

        {/* Required Skills Card */}
        <div className="jobdetail-card">
          <h2 className="jobdetail-section-title">Required Skills & Match</h2>

          <div className="jobdetail-skills-group">
            <p className="jobdetail-skills-label">
              <HiCheckCircle style={{ color: '#7c6ff7' }} /> Matched Skills ({matchedSkills.length})
            </p>
            <div className="jobdetail-skills-chips">
              {matchedSkills.map((skill, i) => (
                <span key={`${skill}-${i}`} className="jobdetail-skill-chip matched">
                  <HiCheckCircle /> {skill}
                </span>
              ))}
            </div>
          </div>

          {unmatchedSkills.length > 0 && (
            <div className="jobdetail-skills-group" style={{ marginTop: 16 }}>
              <p className="jobdetail-skills-label">
                <HiXCircle style={{ color: '#9090a8' }} /> Unmatched Skills ({unmatchedSkills.length})
              </p>
              <div className="jobdetail-skills-chips">
                {unmatchedSkills.map((skill, i) => (
                  <span key={`${skill}-${i}`} className="jobdetail-skill-chip unmatched">
                    <HiXCircle /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job Description Card */}
        <div className="jobdetail-card">
          <h2 className="jobdetail-section-title">Job Description</h2>
          <p className="jobdetail-description-text">
            {job.description || 'No detailed description provided for this position.'}
          </p>

          <h2 className="jobdetail-section-title" style={{ fontSize: 14, marginTop: 20 }}>
            Key Responsibilities / Details
          </h2>
          <ul className="jobdetail-list">
            {responsibilities.map((resp, i) => (
              <li key={i} className="jobdetail-list-item">
                {resp}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
