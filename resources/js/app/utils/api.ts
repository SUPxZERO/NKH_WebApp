import { apiClient } from '@/app/libs/apiClient';

function normalize(url: string): string {
  if (url.startsWith('/api/')) return url.slice(5); // drop leading '/api/'
  return url.replace(/^\//, ''); // drop any leading '/'
}

export const apiGet = <T = any>(url: string, params?: any): Promise<T> => {
  return apiClient.get(normalize(url), { params }).then((r) => r.data);
};

export const apiPost = <T = any>(url: string, data?: any): Promise<T> => {
  return apiClient.post(normalize(url), data).then((r) => r.data);
};

export const apiPut = <T = any>(url: string, data?: any): Promise<T> => {
  return apiClient.put(normalize(url), data).then((r) => r.data);
};

export const apiPatch = <T = any>(url: string, data?: any): Promise<T> => {
  return apiClient.patch(normalize(url), data).then((r) => r.data);
};

export const apiDelete = <T = any>(url: string): Promise<T> => {
  return apiClient.delete(normalize(url)).then((r) => r.data);
};

export const apiUpload = <T = any>(url: string, formData: FormData): Promise<T> => {
  return apiClient.post(normalize(url), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export default apiClient;
