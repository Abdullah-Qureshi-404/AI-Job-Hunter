import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, RotateCw, Calendar, Clock, TrendingUp, Sparkles } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { getMatches, matchJobs } from '../services/jobsApi';
import { getProfile } from '../services/profileApi';
import { getCVs } from '../services/resumeApi';
import { formatPostedDate } from '../utils/formatDate';
import { getCachedValue } from '../services/cache';
import { JobCardSkeleton, StatCardSkeleton } from '../components/ui/Skeleton';

// Sub-component: Animated typing effect subtitle
function TypingSubtitle({ text = 'Your AI is actively matching jobs...' }) {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <p className="text-xs md:text-sm text-zinc-400 font-mono flex items-center gap-1 mt-1">
      <span>{displayedText}</span>
      <span className="w-1.5 h-4 bg-purple-400 animate-pulse inline-block" />
    </p>
  );
}

// Sub-component: Animated count-up for statistics
function AnimatedCountUp({ target = 0 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const num = Number(target) || 0;
    if (num === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 800;
    const stepTime = Math.max(20, Math.abs(Math.floor(duration / num)));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= num) {
        setCount(num);
        clearInterval(timer);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}</span>;
}

// Sub-component: Circular arc gauge for score (>50% emerald, 30-50% amber, <30% red)
function CircularArcGauge({ score, size = 52 }) {
  const hasScore = score != null && !Number.isNaN(Number(score));
  const value = hasScore ? Number(score) : 0;
  
  let color = '#ef4444'; // <30% Red
  let trackColor = 'rgba(239, 68, 68, 0.15)';

  if (value > 50) {
    color = '#10b981'; // >50% Emerald
    trackColor = 'rgba(16, 185, 129, 0.15)';
  } else if (value >= 30) {
    color = '#f59e0b'; // 30-50% Amber
    trackColor = 'rgba(245, 158, 11, 0.15)';
  }

  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasScore
    ? circumference - (value / 100) * circumference
    : circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
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
      <span className="absolute text-xs font-bold font-mono" style={{ color }}>
        {hasScore ? `${Math.round(value)}%` : '—'}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const cachedProf = getCachedValue('profile');
  const cachedCvs = getCachedValue('cvs');
  const cachedMatches = getCachedValue('matches:1');

  const initialProf = Array.isArray(cachedProf) && cachedProf.length > 0 ? cachedProf[0] : (cachedProf?.id ? cachedProf : null);
  const initialCvs = Array.isArray(cachedCvs) ? cachedCvs : [];
  const initialMatches = cachedMatches?.results || [];

  const [profile, setProfile] = useState(initialProf);
  const [cvs, setCvs] = useState(initialCvs);
  const [matchedJobs, setMatchedJobs] = useState(initialMatches);
  const [matchedCount, setMatchedCount] = useState(cachedMatches?.count || initialMatches.length);
  const [loading, setLoading] = useState(!initialProf && !cachedMatches);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        if (!initialProf && !cachedMatches) {
          setLoading(true);
        }
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

        // Read previously computed matches
        try {
          const { results, count } = await getMatches();
          if (isMounted) {
            setMatchedJobs(results);
            setMatchedCount(count);
            setLastSyncTime('Just now');
          }
        } catch (err) {
          console.warn('Dashboard match fetch notice:', err);
          if (isMounted) {
            setMatchedJobs([]);
            setError('Could not load your job matches.');
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


  const handleRefreshMatches = async () => {
    setRefreshing(true);
    setError(null);
    setNotice(null);

    try {
      const { results, degraded, detail } = await matchJobs();
      setMatchedJobs(results.slice(0, 3));
      setMatchedCount(results.length);
      setLastSyncTime('Just now');
      if (degraded) {
        setNotice(detail || 'Apply AI is unavailable - matched using your profile skills.');
      }
    } catch (err) {
      console.error('Failed to refresh matches:', err);
      const message = err?.response?.data?.error;
      setError(message || 'Could not refresh job matches.');
    } finally {
      setRefreshing(false);
    }
  };

  // Compute Stat Card values
  const totalMatched = matchedCount;
  const topMatchScore = matchedJobs.length > 0
    ? Math.max(...matchedJobs.map((m) => Math.round(m.match_score || m.job?.match_score || 0)))
    : 0;

  const username = profile?.name || 'Applicant';
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* HERO SECTION */}
        <div className="glass-card p-6 border-l-4 border-l-purple-500 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome back, {username}!
            </h1>
            <TypingSubtitle text="Your AI is actively matching jobs..." />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-400 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              {currentDateStr}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Last sync: {lastSyncTime}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {notice && (
          <div className="p-4 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {notice}
          </div>
        )}

        {/* STAT CARDS ROW (3 CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Jobs Matched (Violet Accent Glow) */}
          <div
            className="p-5 rounded-2xl border-t-2 border-t-[#7c3aed] relative overflow-hidden shadow-lg shadow-purple-950/30 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'rgba(18, 18, 26, 0.8)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Jobs Matched
              </span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-white font-mono">
                <AnimatedCountUp target={totalMatched} />
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                +3 new today
              </span>
            </div>
          </div>

          {/* Card 2: Top Match % (Emerald Accent Glow) */}
          <div
            className="p-5 rounded-2xl border-t-2 border-t-[#10b981] relative overflow-hidden shadow-lg shadow-emerald-950/30 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'rgba(18, 18, 26, 0.8)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                AI Confidence Score
              </span>
              <CircularArcGauge score={topMatchScore} size={44} />
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {topMatchScore}%
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">Top match percentage</p>
              </div>
            </div>
          </div>

          {/* Card 3: Resumes (Fuchsia Accent Glow) */}
          <div
            className="p-5 rounded-2xl border-t-2 border-t-[#d946ef] relative overflow-hidden shadow-lg shadow-fuchsia-950/30 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'rgba(18, 18, 26, 0.8)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Resumes
              </span>
              <div className="p-2 rounded-xl bg-fuchsia-500/15 text-fuchsia-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-white font-mono">
                {cvs ? cvs.length : 0}
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* TOP MATCHES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Top Matches
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefreshMatches}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 transition-all disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh matches'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/matches')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="glass-card p-8 text-center text-zinc-400 text-sm">
                Loading top matches...
              </div>
            ) : matchedJobs.length > 0 ? (
              matchedJobs.slice(0, 3).map((item) => {
                const job = item.job || item;
                const score = item.match_score != null
                  ? Math.round(item.match_score)
                  : (job.match_score != null ? Math.round(job.match_score) : null);

                const companyName = job.company || 'Company';
                const initial = companyName.trim()[0]?.toUpperCase() || 'C';

                const tags = [];
                if (job.is_remote) tags.push({ label: 'Remote', type: 'remote' });
                if (job.job_type) tags.push({ label: job.job_type, type: job.job_type.toLowerCase().includes('full') ? 'fulltime' : 'type' });
                if (job.source) tags.push({ label: job.source, type: 'source' });

                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="glass-card p-5 cursor-pointer flex items-center justify-between gap-4 transition-all duration-200 hover:scale-[1.015] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-950/20 group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Avatar Circle with Gradient */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-inner shrink-0 border border-purple-400/30">
                        {initial}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {job.title}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium truncate">
                          {job.company} • {job.location || (job.is_remote ? 'Remote' : 'N/A')}
                          {formatPostedDate(job.date_posted) && (
                            <>
                              <span className="text-zinc-600"> • </span>
                              <span className="text-purple-400/90 font-semibold">{formatPostedDate(job.date_posted)}</span>
                            </>
                          )}
                        </p>

                        {/* Tag Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tags.map((t, i) => {
                            let badgeStyle = 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
                            if (t.type === 'remote') {
                              badgeStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                            } else if (t.type === 'fulltime') {
                              badgeStyle = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                            }
                            return (
                              <span
                                key={i}
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle}`}
                              >
                                {t.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Circular Arc Gauge */}
                    <div className="shrink-0">
                      <CircularArcGauge score={score} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-card p-8 text-center text-zinc-500 text-sm">
                No matched jobs yet. Upload a resume on the Resumes page, then refresh.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
