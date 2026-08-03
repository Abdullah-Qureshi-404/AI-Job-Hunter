/**
 * Saved jobs, persisted server-side.
 *
 * Previously this used localStorage, so bookmarks were per-browser and lost
 * on a cache clear. They now live in the database against the user's Supabase
 * id, so they follow the account across devices.
 */

import api from './api';
import { cached, invalidate } from './cache';

const KEY = 'savedJobs';

/** GET /api/jobs/saved/ */
export const getSavedJobs = async ({ force = false } = {}) =>
  cached(
    KEY,
    async () => {
      try {
        const response = await api.get('/api/jobs/saved/');
        const data = response.data;
        return Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        throw error;
      }
    },
    { force, ttl: 120_000 }
  );

/** POST /api/jobs/saved/ */
export const saveJob = async (jobId) => {
  const response = await api.post('/api/jobs/saved/', { job: jobId });
  invalidate(KEY);
  return response.data;
};

/** DELETE /api/jobs/saved/<jobId>/ */
export const unsaveJob = async (jobId) => {
  await api.delete(`/api/jobs/saved/${jobId}/`);
  invalidate(KEY);
};

/**
 * Flip the saved state for a job.
 * @returns {Promise<boolean>} true when the job is now saved
 */
export const toggleSavedJob = async (jobId, currentlySaved) => {
  if (currentlySaved) {
    await unsaveJob(jobId);
    return false;
  }

  await saveJob(jobId);
  return true;
};

/** Whether a job id appears in the user's saved list. */
export const isJobSaved = async (jobId) => {
  const saved = await getSavedJobs();
  return saved.some((item) => String(item.job?.id) === String(jobId));
};
