import { apiClient } from '@/app/libs/apiClient';

function normalize(url: string): string {
  if (url.startsWith('/api/')) return url.slice(5); // drop leading '/api/'
  return url.replace(/^\//, ''); // drop any leading '/'
}

export const apiGet = (url: string, params?: any) => {
  return apiClient.get(normalize(url), { params }).then((r) => r.data) as unknown as Promise<any>;
};

export const apiPost = (url: string, data?: any) => {
  return apiClient.post(normalize(url), data).then((r) => r.data) as unknown as Promise<any>;
};

export const apiPut = (url: string, data?: any) => {
  return apiClient.put(normalize(url), data).then((r) => r.data) as unknown as Promise<any>;
};

export const apiPatch = (url: string, data?: any) => {
  return apiClient.patch(normalize(url), data).then((r) => r.data) as unknown as Promise<any>;
};

export const apiDelete = (url: string) => {
  return apiClient.delete(normalize(url)).then((r) => r.data) as unknown as Promise<any>;
};

export const apiUpload = (url: string, formData: FormData) => {
  return apiClient.post(normalize(url), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data) as unknown as Promise<any>;
};

export default apiClient;
