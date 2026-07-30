import api from './api';
import { cached, invalidate } from './cache';

/**
 * GET /api/jobs/
 * Retrieves a page of active job listings.
 *
 * Search and filtering are performed by the API, not in the browser: the
 * response is paginated (20 per page), so filtering client-side would only
 * ever search the current page.
 *
 * @param {Object} params - { page, search, source, job_type, country, is_remote, ordering }
 * @returns {Promise<{results: Array, count: number, next: string|null, previous: string|null}>}
 */
export const getJobs = async (params = {}) => {
  // Drop empty values so we don't send `?search=` and match nothing.
  const query = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query[key] = value;
    }
  });

  // Cached per exact param combination, so flipping between filter chips or
  // paging back a page is instant instead of a fresh round-trip.
  const key = `jobs:${JSON.stringify(query)}`;

  return cached(key, async () => {
    try {
      const response = await api.get('/api/jobs/', { params: query });

      if (response.data && Array.isArray(response.data.results)) {
        return {
          results: response.data.results,
          count: response.data.count ?? response.data.results.length,
          next: response.data.next ?? null,
          previous: response.data.previous ?? null,
        };
      }

      const results = Array.isArray(response.data) ? response.data : [];
      return { results, count: results.length, next: null, previous: null };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  });
};

/**
 * POST /api/jobs/fetch/
 * Runs the scrapers server-side to populate the job table.
 * Synchronous and slow - expect this to take a while.
 */
export const fetchJobs = async () => {
  try {
    const response = await api.post('/api/jobs/fetch/', {});
    invalidate('jobs:');
    return response.data;
  } catch (error) {
    console.error('Error fetching new jobs:', error);
    throw error;
  }
};

/**
 * GET /api/jobs/<id>/
 * Retrieves detailed information for a single job listing.
 */
export const getJobDetail = async (id) =>
  cached(`job:${id}`, async () => {
    try {
      const response = await api.get(`/api/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job detail for id ${id}:`, error);
      throw error;
    }
  });

/**
 * GET /api/matcher/matches/
 * Reads previously computed matches. Cheap - use this for page loads.
 */
export const getMatches = async ({ force = false } = {}) =>
  cached(
    'matches',
    async () => {
      try {
        const response = await api.get('/api/matcher/matches/');
        if (response.data && Array.isArray(response.data.results)) {
          return { results: response.data.results, degraded: false };
        }
        return { results: Array.isArray(response.data) ? response.data : [], degraded: false };
      } catch (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }
    },
    { force, ttl: 300_000 }
  );

/**
 * POST /api/matcher/match/
 * Recomputes match scores across every active job and persists them.
 * Expensive - trigger from an explicit user action, not on mount.
 *
 * @returns {Promise<{results: Array, degraded: boolean, detail?: string}>}
 *   `degraded` is true when Apply AI was unreachable and matching fell back
 *   to the skills listed on the user's profile.
 */
export const matchJobs = async () => {
  try {
    const response = await api.post('/api/matcher/match/', {});
    const data = response.data;

    // Scores changed - drop cached matches and job lists carrying match_score.
    invalidate('matches');
    invalidate('jobs:');

    if (data && Array.isArray(data.results)) {
      return {
        results: data.results,
        degraded: Boolean(data.degraded),
        detail: data.detail,
      };
    }

    return {
      results: Array.isArray(data) ? data : [],
      degraded: false,
    };
  } catch (error) {
    console.error('Error matching jobs:', error);
    throw error;
  }
};

/**
 * POST /api/jobs/analyze/
 * Analyzes raw job description text via ApplyAI service.
 * @param {Object} data - { job_description: string }
 */
export const analyzeJob = async (data) => {
  try {
    const response = await api.post('/api/jobs/analyze/', data);
    return response.data;
  } catch (error) {
    console.error('Error analyzing job:', error);
    throw error;
  }
};

/**
 * POST /api/jobs/analyze-image/
 * Analyzes an uploaded job screenshot/image via vision AI.
 * @param {File} file - Image File object or FormData
 */
export const analyzeJobImage = async (file) => {
  try {
    const formData = file instanceof FormData ? file : new FormData();
    if (!(file instanceof FormData)) {
      formData.append('file', file);
    }
    const response = await api.post('/api/jobs/analyze-image/', formData);
    return response.data;
  } catch (error) {
    console.error('Error analyzing job image:', error);
    throw error;
  }
};

/**
 * POST /api/jobs/generate-resume/
 * Generates tailored resume content aligned with target job description.
 * @param {Object} data - { job_description: string }
 */
export const generateResume = async (data) => {
  try {
    const response = await api.post('/api/jobs/generate-resume/', data);
    return response.data;
  } catch (error) {
    console.error('Error generating resume:', error);
    throw error;
  }
};

/**
 * POST /api/jobs/generate-email/
 * Generates personalized cold outreach application email.
 * @param {Object} data - { job_title: string, company_name: string, job_description: string }
 */
export const generateEmail = async (data) => {
  try {
    const response = await api.post('/api/jobs/generate-email/', data);
    return response.data;
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
};
