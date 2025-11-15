import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Base API client for Laravel Sanctum + Axios
// - Uses /sanctum/csrf-cookie for CSRF protection on state-changing requests
// - Retries once on 419 (CSRF token mismatch) after refreshing the cookie

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';
const API_BASE_URL = BACKEND_BASE ? `${BACKEND_BASE.replace(/\/$/, '')}/api` : '/api';

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
  });

  let isRefreshing = false;
  let refreshPromise: Promise<AxiosResponse<any, any>> | null = null;

  async function ensureCsrfCookie() {
    if (!isRefreshing) {
      isRefreshing = true;
      const target = BACKEND_BASE?.replace(/\/$/, '') || '';
      refreshPromise = axios.get(`${target}/sanctum/csrf-cookie`, { withCredentials: true });
      try {
        await refreshPromise;
      } finally {
        isRefreshing = false;
      }
    } else if (refreshPromise) {
      await refreshPromise;
    }
  }

  instance.interceptors.request.use(async (config) => {
    // For non-GET requests, make sure we have a CSRF cookie first
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head' && method !== 'options') {
      await ensureCsrfCookie();
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      const status = error.response?.status;

      if (status === 419 && !originalRequest._retry) {
        originalRequest._retry = true;
        await ensureCsrfCookie();
        return instance(originalRequest);
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export const apiClient = createClient();

// Convenience helpers with proper typing
export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await apiClient.get<T>(url, config);
  return data;
}

export async function apiPost<T>(url: string, body?: any, config?: AxiosRequestConfig) {
  const { data } = await apiClient.post<T>(url, body, config);
  return data;
}

export async function apiPut<T>(url: string, body?: any, config?: AxiosRequestConfig) {
  const { data } = await apiClient.put<T>(url, body, config);
  return data;
}

export async function apiPatch<T>(url: string, body?: any, config?: AxiosRequestConfig) {
  const { data } = await apiClient.patch<T>(url, body, config);
  return data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await apiClient.delete<T>(url, config);
  return data;
}
