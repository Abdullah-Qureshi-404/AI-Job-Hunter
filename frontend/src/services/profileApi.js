import api from './api';

/**
 * GET /api/profiles/
 * Retrieves career profile details for authenticated user.
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/api/profiles/');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * POST /api/profiles/
 * Creates a new career profile.
 * @param {Object} data - Profile fields (name, email, skills, experience_level, etc.)
 */
export const createProfile = async (data) => {
  try {
    const response = await api.post('/api/profiles/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};
