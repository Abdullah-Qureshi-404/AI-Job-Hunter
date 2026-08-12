import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCw } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import JobCard from '../components/ui/JobCard';
import { getJobs, getJobDetail } from '../services/jobsApi';
import { parseApiError } from '../services/api';
import { JobCardSkeleton } from '../components/ui/Skeleton';


const filterCategories = [
  { label: 'All', params: {} },
  { label: 'Remote', params: { is_remote: true } },
  { label: 'Full-time', params: { job_type: 'full-time' } },
  { label: 'Part-time', params: { job_type: 'part-time' } },
  { label: 'Contract', params: { job_type: 'freelance' } },
  { label: 'Internship', params: { job_type: 'internship' } },
];

const PAGE_SIZE = 20;

export default function Jobs() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // ⌘K or Ctrl+K shortcut listener to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadJobs = useCallback(async ({ signalMounted } = {}) => {
    const activeFilter = filterCategories.find((c) => c.label === selectedFilter);

    try {
      setLoading(true);
      setError(null);

      const { results, count: total } = await getJobs({
        page,
        search: appliedSearch,
        ...(activeFilter?.params || {}),
      });

      if (signalMounted && !signalMounted()) return;

      setJobs(results);
      setCount(total);
    } catch (err) {
      if (signalMounted && !signalMounted()) return;
      console.error('Failed to fetch jobs:', err);
      setError(parseApiError(err) || 'Failed to load jobs from backend. Please try again later.');
    } finally {
      if (!signalMounted || signalMounted()) setLoading(false);
    }
  }, [page, appliedSearch, selectedFilter]);

  useEffect(() => {
    let isMounted = true;
    loadJobs({ signalMounted: () => isMounted });
    return () => {
      isMounted = false;
    };
  }, [loadJobs]);

  const handleReloadFromDb = () => {
    invalidate('jobs:');
    loadJobs();
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <MainLayout title="Browse Jobs">
      <div className="space-y-6">
        {/* Full-width Glassmorphic Search Bar with ⌘K Badge */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-purple-400 transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full pl-11 pr-14 py-3 bg-[#12121a]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 shadow-lg shadow-black/20 transition-all duration-200"
            placeholder="Search by title, company, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-400 bg-white/5 border border-white/10 rounded-md shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Pill-Style Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filterCategories.map((category) => {
            const isActive = selectedFilter === category.label;
            return (
              <button
                key={category.label}
                type="button"
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40 glow-purple'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/10 hover:border-white/20'
                }`}
                onClick={() => {
                  setSelectedFilter(category.label);
                  setPage(1);
                }}
              >
                {category.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-purple-300 rounded-full shadow-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* Results Summary Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium px-1">
          <div className="flex items-center gap-3">
            <div>
              Showing <span className="text-zinc-100 font-bold">{jobs.length}</span> of{' '}
              <span className="text-zinc-100 font-bold">{count}</span> jobs
              {selectedFilter !== 'All' && (
                <span className="ml-2 text-purple-400 font-semibold">
                  • Filter: {selectedFilter}
                </span>
              )}
              {appliedSearch && (
                <span className="ml-2 text-indigo-400 font-semibold truncate max-w-[200px] inline-block align-bottom">
                  • Search: &quot;{appliedSearch}&quot;
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleReloadFromDb}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs border border-white/10 transition-all duration-200 disabled:opacity-50"
              title="Reload job listings from database"
            >
              <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span>{loading ? 'Reloading…' : 'Reload Jobs'}</span>
            </button>
          </div>
          {totalPages > 1 && (
            <span className="text-zinc-500">Page {page} of {totalPages}</span>
          )}
        </div>

        {/* Job Grid */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (

            <div className="glass-card p-6 text-center text-rose-400 text-sm font-semibold border-rose-500/30">
              {error}
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => {
              const tags = [];
              if (job.is_remote) tags.push('Remote');
              if (job.job_type) tags.push(job.job_type);
              if (job.source) tags.push(job.source);

              const score = job.match_score != null ? Math.round(job.match_score) : null;
              const isTop = score != null && score >= 90;

              return (
                <JobCard
                  key={job.id}
                  title={job.title}
                  company={job.company}
                  location={job.location || (job.is_remote ? 'Remote' : 'N/A')}
                  tags={tags}
                  matchScore={score}
                  datePosted={job.date_posted}
                  isTopMatch={isTop}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  onMouseEnter={() => getJobDetail(job.id).catch(() => {})}
                />
              );
            })
          ) : (
            <div className="glass-card p-12 text-center text-zinc-500 text-sm">
              {appliedSearch || selectedFilter !== 'All'
                ? 'No jobs match your search.'
                : 'No jobs yet. The scrapers run twice daily; check back shortly.'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && !error && count > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-4 pt-4 text-xs text-zinc-400">
            <button
              type="button"
              className="px-4 py-2 rounded-xl font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span className="font-medium">
              Page <span className="text-zinc-200 font-bold">{page}</span> of{' '}
              <span className="text-zinc-200 font-bold">{totalPages}</span>
            </span>
            <button
              type="button"
              className="px-4 py-2 rounded-xl font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
