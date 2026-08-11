import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  CircleDollarSign,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import MatchBadge from '../components/ui/MatchBadge';
import JobDescription from '../components/ui/JobDescription';
import { getSavedJobs, toggleSavedJob } from '../services/savedJobs';
import { getJobDetail } from '../services/jobsApi';
import { formatPostedDate } from '../utils/formatDate';

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
        <div className="space-y-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </button>
          <div className="glass-card p-12 text-center text-zinc-400 text-sm">
            Loading job details...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !job) {
    return (
      <MainLayout title="Job Details">
        <div className="space-y-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </button>
          <div className="glass-card p-12 text-center text-rose-400 font-semibold text-sm">
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

  const getInitials = (name) => {
    if (!name) return 'CO';
    const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const hasRequirements = typeof job.requirements === 'string' && job.requirements.trim().length > 0;
  const matchScore = job.match_score != null ? Math.round(job.match_score) : null;

  return (
    <MainLayout title="Job Details">
      <div className="space-y-6 relative">
        {/* STICKY HEADER BAR (Visible while scrolling) */}
        <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 py-3 px-4 -mx-4 md:-mx-8 md:px-8 mb-6 flex items-center justify-between shadow-2xl transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-purple-400/30">
              {getInitials(job.company)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{job.title}</h2>
              <p className="text-[11px] text-zinc-400 truncate">{job.company} • {job.location || 'Remote'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-purple-950/40 glow-purple transition-all duration-200"
              onClick={() => navigate(`/apply/${id}`)}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              Build Resume &amp; Email
            </button>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={savingBookmark}
              className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                isSaved
                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title={isSaved ? 'Saved' : 'Save'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-purple-400" /> : <Bookmark className="w-4 h-4" />}
            </button>
            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/5 text-zinc-400 border border-white/10 hover:text-white hover:bg-white/10 transition-all"
                title="Apply Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          onClick={() => navigate('/jobs')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </button>

        {/* JOB HERO CARD */}
        <div className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* 64px Large Company Initial Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg border border-purple-400/30 shrink-0">
                {getInitials(job.company)}
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 text-zinc-200">
                    <Building2 className="w-4 h-4 text-purple-400" /> {job.company}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="inline-flex items-center gap-1.5 text-zinc-200">
                    <MapPin className="w-4 h-4 text-purple-400" /> {job.location || job.country || 'Remote'}
                  </span>
                  {formatPostedDate(job.date_posted) && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="inline-flex items-center gap-1.5 text-purple-300 font-semibold">
                        <Clock className="w-4 h-4 text-purple-400" /> {formatPostedDate(job.date_posted)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Match Badge Top Right */}
            {matchScore != null && (
              <div className="shrink-0 self-center md:self-start">
                <MatchBadge percentage={matchScore} size={68} />
              </div>
            )}
          </div>

          {/* Key Details Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
            {job.is_remote && (
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Remote
              </span>
            )}
            {job.job_type && (
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {job.job_type}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-800/80 text-emerald-400 border border-zinc-700/60">
              <CircleDollarSign className="w-4 h-4" /> {salaryText}
            </span>
            {job.source && (
              <span className="font-mono text-xs bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 px-3 py-1 rounded-xl">
                Source: {job.source}
              </span>
            )}
          </div>

          {/* 3 Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
            {/* Primary Action Button */}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-purple-950/50 glow-purple transition-all duration-200"
              onClick={() => navigate(`/apply/${id}`)}
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              Build Resume &amp; Email
            </button>

            {/* Save Button (Ghost) */}
            <button
              type="button"
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                isSaved
                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-950/20'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
              disabled={savingBookmark}
              onClick={handleToggleSave}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-purple-400" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>

            {/* Apply Link (Ghost) */}
            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <ExternalLink className="w-4 h-4 text-zinc-400" /> Apply Link
              </a>
            )}
          </div>
        </div>

        {/* AI MATCH SECTION (If match score exists) */}
        {matchScore != null && (
          <div className="glass-card p-6 md:p-8 border-l-4 border-l-purple-500 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  AI Match Analysis
                </h2>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Calculated using your uploaded resume &amp; profile skills
                </p>
              </div>

              <div className="flex items-center gap-3">
                <MatchBadge percentage={matchScore} size={56} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  Match Tier
                </span>
                <p className="text-sm font-bold text-white">
                  {matchScore >= 80 ? 'High Alignment' : matchScore >= 50 ? 'Moderate Match' : 'Potential Match'}
                </p>
                <p className="text-xs text-zinc-400">
                  {matchScore >= 80
                    ? 'Your skills and experience align closely with this job specification.'
                    : 'Some overlap detected. Tailoring your resume will boost your chances.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Recommended Action
                </span>
                <p className="text-sm font-bold text-white">Generate Tailored CV</p>
                <p className="text-xs text-zinc-400">
                  Click &quot;Build Resume &amp; Email&quot; above to customize your application for this role.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requirements */}
        {hasRequirements && (
          <div className="glass-card p-6 md:p-8 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight border-b border-white/5 pb-3">
              Requirements
            </h2>
            <JobDescription text={job.requirements} emptyMessage="" />
          </div>
        )}

        {/* Job Description Card */}
        <div className="glass-card p-6 md:p-8 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight border-b border-white/5 pb-3">
            Job Description
          </h2>
          <JobDescription
            text={job.description_formatted || job.description}
            emptyMessage="No detailed description provided for this position."
          />
        </div>
      </div>
    </MainLayout>
  );
}
