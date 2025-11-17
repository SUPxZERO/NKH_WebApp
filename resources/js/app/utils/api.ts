import axios from 'axios';

// Use Vite-provided environment variable for backend API base URL.
// Set `VITE_API_BASE_URL` in your `.env` to e.g. `http://127.0.0.1:8000` during development.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for Laravel Sanctum
});

// Flag to track if CSRF cookie has been initialized
let csrfCookieInitialized = false;

// Initialize CSRF cookie on app start
const initializeCsrfCookie = async () => {
  if (!csrfCookieInitialized) {
    try {
      // Call the backend directly so the CSRF cookie is set for the API domain.
      const target = API_BASE?.replace(/\/$/, '') || '';
      await axios.get(`${target}/sanctum/csrf-cookie`, { withCredentials: true });
      csrfCookieInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize CSRF cookie:', error);
    }
  }
};

// Call on module load to initialize session
initializeCsrfCookie();

// Helper to get XSRF token from cookie
const getXsrfToken = () => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
};

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    // Ensure CSRF cookie is initialized before making any request
    if (!csrfCookieInitialized) {
      await initializeCsrfCookie();
    }
    
    // Add XSRF token to request headers for state-changing requests
    const xsrfToken = getXsrfToken();
    if (xsrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
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
  return api.get(url, { params }) as unknown as Promise<any>;
};

export const apiPost = (url: string, data?: any) => {
  return api.post(url, data) as unknown as Promise<any>;
};

export const apiPut = (url: string, data?: any) => {
  return api.put(url, data) as unknown as Promise<any>;
};

export const apiPatch = (url: string, data?: any) => {
  return api.patch(url, data) as unknown as Promise<any>;
};

export const apiDelete = (url: string) => {
  return api.delete(url) as unknown as Promise<any>;
};

// File upload helper
export const apiUpload = (url: string, formData: FormData) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }) as unknown as Promise<any>;
};

export default api;
