import api from './api';
import { cached, invalidate, primeCache } from './cache';

const PROFILE_KEY = 'profile';

/**
 * GET /api/profiles/
 * Retrieves career profile details for authenticated user.
 *
 * Cached: the Dashboard, Profile and Resumes pages all need this, and it
 * changes only when the user edits it.
 */
export const getProfile = async ({ force = false } = {}) =>
  cached(
    PROFILE_KEY,
    async () => {
      try {
        const response = await api.get('/api/profiles/');
        if (response.data && Array.isArray(response.data.results)) {
          return response.data.results;
        }
        return response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },
    { force, ttl: 300_000 }
  );

/**
 * POST /api/profiles/
 * Creates or updates the authenticated user's career profile.
 * @param {Object} data - Profile fields (name, email, skills, experience_level, etc.)
 */
export const createProfile = async (data) => {
  try {
    const response = await api.post('/api/profiles/', data);

    // Serve the saved profile straight from the response instead of making
    // the caller re-fetch it.
    if (response.data?.id) {
      primeCache(PROFILE_KEY, [response.data], 300_000);
    } else {
      invalidate(PROFILE_KEY);
    }

    // Skills feed matching, so any cached matches are now stale.
    invalidate('matches');

    return response.data;
  } catch (error) {
    invalidate(PROFILE_KEY);
    console.error('Error creating profile:', error);
    throw error;
  }
};
