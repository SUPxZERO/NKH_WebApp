import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for Laravel Sanctum
});

// Ensure axios knows the Laravel XSRF cookie/header names
api.defaults.xsrfCookieName = 'XSRF-TOKEN';
api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    // Get CSRF token for non-GET requests. Use a plain axios call with
    // withCredentials to avoid re-entering this instance's interceptor
    // (which would cause recursion).
    if (config.method !== 'get') {
      try {
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
      } catch (error) {
        console.warn('Failed to get CSRF cookie:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const apiGet = (url: string, params?: any) => {
  return api.get(url, { params });
};

export const apiPost = (url: string, data?: any) => {
  return api.post(url, data);
};

export const apiPut = (url: string, data?: any) => {
  return api.put(url, data);
};

export const apiPatch = (url: string, data?: any) => {
  return api.patch(url, data);
};

export const apiDelete = (url: string) => {
  return api.delete(url);
};

// File upload helper
export const apiUpload = (url: string, formData: FormData) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;
