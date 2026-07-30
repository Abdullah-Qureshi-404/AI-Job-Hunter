import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch } from 'react-icons/hi';
import MainLayout from '../components/layout/MainLayout';
import JobCard from '../components/ui/JobCard';
import { getJobs, getJobDetail } from '../services/jobsApi';
import { parseApiError } from '../services/api';
import './Jobs.css';

// Each chip maps to real query params the API supports. Skill-name chips were
// removed: the backend has no skill field, so they could only ever have
// filtered the 20 rows already in the browser.
const filterCategories = [
  { label: 'All', params: {} },
  { label: 'Remote', params: { is_remote: true } },
  { label: 'Full-time', params: { job_type: 'full-time' } },
  { label: 'Part-time', params: { job_type: 'part-time' } },
  // Scrapers normalise "contract"/"contractor" to freelance (see
  // jobs/scrapers/base.py), so "contract" is not a valid DB choice.
  { label: 'Contract', params: { job_type: 'freelance' } },
  { label: 'Internship', params: { job_type: 'internship' } },
];

const PAGE_SIZE = 20;

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Debounce so typing doesn't fire a request per keystroke.
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

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <MainLayout title="Browse Jobs">
      <div className="jobs-container">
        {/* Search Section */}
        <div className="jobs-search-box">
          <HiOutlineSearch className="jobs-search-icon" />
          <input
            type="text"
            className="jobs-search-input"
            placeholder="Search by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="jobs-filter-chips">
          {filterCategories.map((category) => (
            <button
              key={category.label}
              type="button"
              className={`jobs-chip${selectedFilter === category.label ? ' active' : ''}`}
              onClick={() => {
                setSelectedFilter(category.label);
                setPage(1);
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Job Grid */}
        <div className="jobs-grid">
          {loading ? (
            <div className="jobs-empty">Loading jobs...</div>
          ) : error ? (
            <div className="jobs-empty" style={{ color: '#ff6b6b' }}>{error}</div>
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
                  isTopMatch={isTop}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  // Warm the cache while the pointer is on the card, so the
                  // detail page is usually already loaded on click.
                  onMouseEnter={() => getJobDetail(job.id).catch(() => {})}
                />
              );
            })
          ) : (
            <div className="jobs-empty">
              {appliedSearch || selectedFilter !== 'All'
                ? 'No jobs match your search.'
                : 'No jobs yet. The scrapers run twice daily; check back shortly.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && count > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 20, fontSize: 13, color: '#9090a8' }}>
            <button
              type="button"
              className="jobs-chip"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span>Page {page} of {totalPages} · {count} jobs</span>
            <button
              type="button"
              className="jobs-chip"
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
