import api from './api';

/**
 * GET /api/profiles/cvs/
 * Fetches uploaded CV files and extracted skills.
 */
export const getCVs = async () => {
  try {
    const response = await api.get('/api/profiles/cvs/');
    return response.data;
  } catch (error) {
    console.error('Error fetching CVs:', error);
    throw error;
  }
};

/**
 * POST /api/profiles/cvs/upload/
 * Uploads a PDF CV file and extracts text skills automatically.
 * @param {FormData} formData - Multipart form-data containing profile, label, and file
 */
export const uploadCV = async (formData) => {
  try {
    const response = await api.post('/api/profiles/cvs/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading CV:', error);
    throw error;
  }
};

/**
 * DELETE /api/profiles/cvs/<id>/delete/
 * Deletes an uploaded CV file by ID.
 * @param {number|string} id - CV record ID
 */
export const deleteCV = async (id) => {
  try {
    const response = await api.delete(`/api/profiles/cvs/${id}/delete/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting CV for id ${id}:`, error);
    throw error;
  }
};
