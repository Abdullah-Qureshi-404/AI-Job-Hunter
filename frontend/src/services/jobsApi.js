import api from './api';

/**
 * GET /api/jobs/
 * Retrieves list of active job listings.
 */
export const getJobs = async () => {
  try {
    const response = await api.get('/api/jobs/');
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

/**
 * GET /api/jobs/<id>/
 * Retrieves detailed information for a single job listing.
 */
export const getJobDetail = async (id) => {
  try {
    const response = await api.get(`/api/jobs/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job detail for id ${id}:`, error);
    throw error;
  }
};

/**
 * POST /api/matcher/match/
 * Calculates match scores between active job listings and user's profile skills.
 */
export const matchJobs = async () => {
  try {
    const response = await api.post('/api/matcher/match/', {});
    return response.data;
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
    const response = await api.post('/api/jobs/analyze-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
