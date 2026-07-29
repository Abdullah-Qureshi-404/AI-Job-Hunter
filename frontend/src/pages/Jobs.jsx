import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi';
import MainLayout from '../components/layout/MainLayout';
import JobCard from '../components/ui/JobCard';
import { getJobs } from '../services/jobsApi';
import './Jobs.css';

const filterCategories = ['All', 'Remote', 'Full-time', 'Python', 'Django', 'FastAPI', 'AI/ML'];

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getJobs();
        if (isMounted) {
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch jobs:', err);
          setError('Failed to load jobs from backend. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const title = job.title || '';
    const company = job.company || '';
    const location = job.location || '';
    const jobType = job.job_type || '';
    const source = job.source || '';

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      title.toLowerCase().includes(searchLower) ||
      company.toLowerCase().includes(searchLower) ||
      location.toLowerCase().includes(searchLower) ||
      jobType.toLowerCase().includes(searchLower) ||
      source.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Remote') return job.is_remote || location.toLowerCase().includes('remote');
    if (selectedFilter === 'Full-time') return jobType.toLowerCase().includes('full');

    const filterLower = selectedFilter.toLowerCase();
    return (
      title.toLowerCase().includes(filterLower) ||
      company.toLowerCase().includes(filterLower) ||
      jobType.toLowerCase().includes(filterLower)
    );
  });

  return (
    <MainLayout title="Browse Jobs" primaryButton="Search Jobs">
      <div className="jobs-container">
        {/* Search Section */}
        <div className="jobs-search-box">
          <HiOutlineSearch className="jobs-search-icon" />
          <input
            type="text"
            className="jobs-search-input"
            placeholder="Search by title, company, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="jobs-filter-btn" aria-label="Filter settings">
            <HiOutlineFilter />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="jobs-filter-chips">
          {filterCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={`jobs-chip${selectedFilter === category ? ' active' : ''}`}
              onClick={() => setSelectedFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Job Grid */}
        <div className="jobs-grid">
          {loading ? (
            <div className="jobs-empty">Loading jobs...</div>
          ) : error ? (
            <div className="jobs-empty" style={{ color: '#ff6b6b' }}>{error}</div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job, idx) => {
              const tags = [];
              if (job.is_remote) tags.push('Remote');
              if (job.job_type) tags.push(job.job_type);
              if (job.source) tags.push(job.source);

              const score = job.match_score || (95 - (idx * 5) > 60 ? 95 - (idx * 5) : 75);
              const isTop = score >= 90;

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
            <div className="jobs-empty">No jobs found matching your criteria.</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
