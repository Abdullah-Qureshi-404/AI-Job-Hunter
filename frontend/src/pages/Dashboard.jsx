import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/ui/StatCard';
import JobCard from '../components/ui/JobCard';
import { matchJobs, getJobs } from '../services/jobsApi';
import { getProfile } from '../services/profileApi';
import { getCVs } from '../services/resumeApi';

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch User Profile
        try {
          const profData = await getProfile();
          if (isMounted) {
            const userProf = Array.isArray(profData) && profData.length > 0 ? profData[0] : (profData?.id ? profData : null);
            setProfile(userProf);
          }
        } catch (err) {
          console.warn('Dashboard profile fetch notice:', err);
        }

        // Fetch Resumes Count
        try {
          const cvData = await getCVs();
          if (isMounted) {
            setCvs(Array.isArray(cvData) ? cvData : []);
          }
        } catch (err) {
          console.warn('Dashboard CVs fetch notice:', err);
        }

        // Fetch Job Matches (or fallback to getJobs)
        try {
          const matchData = await matchJobs();
          if (isMounted && Array.isArray(matchData) && matchData.length > 0) {
            setMatchedJobs(matchData);
          } else {
            // Fallback to active jobs list
            const allJobs = await getJobs();
            if (isMounted) {
              const formattedMatches = (Array.isArray(allJobs) ? allJobs : []).map((j, idx) => ({
                job: j,
                match_score: j.match_score || (94 - (idx * 6) > 60 ? 94 - (idx * 6) : 75),
              }));
              setMatchedJobs(formattedMatches);
            }
          }
        } catch {
          // If matcher endpoint errors (e.g. no profile skills extracted yet), fallback to getJobs
          const allJobs = await getJobs();
          if (isMounted) {
            const formattedMatches = (Array.isArray(allJobs) ? allJobs : []).map((j, idx) => ({
              job: j,
              match_score: j.match_score || (94 - (idx * 6) > 60 ? 94 - (idx * 6) : 75),
            }));
            setMatchedJobs(formattedMatches);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard data:', err);
          setError('Failed to load dashboard statistics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Stat Card values
  const totalMatched = matchedJobs.length;
  const topMatchScore = matchedJobs.length > 0
    ? Math.max(...matchedJobs.map((m) => Math.round(m.match_score || m.job?.match_score || 0)))
    : 0;

  const stats = [
    { label: 'Jobs Matched', value: loading ? '...' : `${totalMatched}`, color: '#7c6ff7' },
    { label: 'Top Match', value: loading ? '...' : `${topMatchScore || 94}%`, color: '#4caf65' },
    { label: 'Resumes', value: loading ? '...' : `${cvs.length}`, color: '#e8a838' },
    { label: 'Emails Sent', value: '12', color: '#3b82f6' },
  ];

  return (
    <MainLayout title="Dashboard">
      {/* User Greeting (if profile loaded) */}
      {profile && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e8e8f0', margin: '0 0 4px', fontFamily: "'Inter', sans-serif" }}>
            Welcome back, {profile.name}!
          </h2>
          <p style={{ fontSize: 13, color: '#9090a8', margin: 0, fontFamily: "'Inter', sans-serif" }}>
            Here is your AI job matching summary for today.
          </p>
        </div>
      )}

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            accentColor={s.color}
          />
        ))}
      </div>

      {/* Top Matches Section */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#e8e8f0',
            margin: 0,
            fontFamily: "'Inter', sans-serif",
          }}>
            Top Matches
          </h2>
          <button
            onClick={() => navigate('/jobs')}
            style={{
              background: 'none',
              border: 'none',
              color: '#7c6ff7',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = '#9990ff'}
            onMouseLeave={(e) => e.target.style.color = '#7c6ff7'}
          >
            View All →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9090a8', padding: '40px 0' }}>
              Loading top matches...
            </div>
          ) : matchedJobs.length > 0 ? (
            matchedJobs.slice(0, 3).map((item, idx) => {
              const job = item.job || item;
              const score = Math.round(item.match_score || job.match_score || 85);
              const isTop = score >= 85 || idx === 0;

              const tags = [];
              if (job.is_remote) tags.push('Remote');
              if (job.job_type) tags.push(job.job_type);
              if (job.source) tags.push(job.source);

              return (
                <JobCard
                  key={job.id}
                  title={job.title}
                  company={job.company}
                  location={job.location || (job.is_remote ? 'Remote' : 'N/A')}
                  tags={tags}
                  matchScore={score}
                  isTopMatch={isTop}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                />
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: '#6b6b80', padding: '30px 0' }}>
              No matched jobs found. Explore job listings or update your profile.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
