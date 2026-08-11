import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from Supabase session or localStorage before every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[api] Failed to get session token:', err);
  }

  // Let the browser set multipart boundary for FormData uploads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

// Redirect to the login screen when the Supabase token has expired, rather
// than letting every page render a silent empty state.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && data?.session?.access_token) {
          // Retry the original request once with the refreshed token.
          const config = error.config;
          config.headers.Authorization = `Bearer ${data.session.access_token}`;
          return api.request(config);
        }
      } catch (err) {
        console.warn('[api] Session refresh failed:', err);
      }

      localStorage.removeItem('token');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Turn an axios error into a message worth showing a user.
 *
 * Handles the three shapes this stack produces: Django's `{error: "..."}`,
 * DRF's bare serializer errors `{field: ["msg"]}`, and FastAPI's
 * `{detail: "..."}` proxied through Django.
 */
export const parseApiError = (error) => {
  const data = error?.response?.data;

  if (!data) return error?.message || null;
  if (typeof data === 'string') return data;

  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;

  // DRF field errors: {"job_description": ["This field is required."]}
  const fieldMessages = Object.entries(data)
    .filter(([, value]) => Array.isArray(value) || typeof value === 'string')
    .map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(' ') : value;
      return field === 'non_field_errors' ? text : `${field}: ${text}`;
    });

  if (fieldMessages.length > 0) return fieldMessages.join('\n');

  return error?.message || null;
};

export default api;

