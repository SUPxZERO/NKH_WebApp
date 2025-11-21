import { apiClient as api } from '@/app/libs/apiClient';

export const dashboardApi = {
    getStats: () => api.get('/admin/dashboard/stats'),
};

export const categoriesApi = {
    getAll: (params) => api.get('/admin/categories', { params }),
    getStats: () => api.get('/admin/category-stats'),
    get: (id) => api.get(`/admin/categories/${id}`),
    create: (data) => api.post('/admin/categories', data),
    update: (id, data) => api.put(`/admin/categories/${id}`, data),
    delete: (id) => api.delete(`/admin/categories/${id}`),
    toggleStatus: (id, isActive) => api.put(`/admin/categories/${id}/toggle-status`, { is_active: isActive }),
};

export const menuItemsApi = {
    getAll: (params) => api.get('/admin/menu-items', { params }),
    get: (id) => api.get(`/admin/menu-items/${id}`),
    create: (data) => api.post('/admin/menu-items', data),
    update: (id, data) => api.put(`/admin/menu-items/${id}`, data),
    delete: (id) => api.delete(`/admin/menu-items/${id}`),
};

export const employeesApi = {
    getAll: (params) => api.get('/admin/employees', { params }),
    get: (id) => api.get(`/admin/employees/${id}`),
    create: (data) => api.post('/admin/employees', data),
    update: (id, data) => api.put(`/admin/employees/${id}`, data),
    delete: (id) => api.delete(`/admin/employees/${id}`),
};

export const customersApi = {
    getAll: (params) => api.get('/admin/customers', { params }),
    get: (id) => api.get(`/admin/customers/${id}`),
    create: (data) => api.post('/admin/customers', data),
    update: (id, data) => api.put(`/admin/customers/${id}`, data),
    delete: (id) => api.delete(`/admin/customers/${id}`),
};

export const ordersApi = {
    getAll: (params) => api.get('/admin/orders', { params }),
    get: (id) => api.get(`/admin/orders/${id}`),
    create: (data) => api.post('/admin/orders', data),
    update: (id, data) => api.put(`/admin/orders/${id}`, data),
    delete: (id) => api.delete(`/admin/orders/${id}`),
    approve: (id) => api.patch(`/admin/orders/${id}/approve`),
    reject: (id, data = {}) => api.patch(`/admin/orders/${id}/reject`, data),
};

export const expensesApi = {
    getAll: (params) => api.get('/admin/expenses', { params }),
    get: (id) => api.get(`/admin/expenses/${id}`),
    create: (data) => api.post('/admin/expenses', data),
    update: (id, data) => api.put(`/admin/expenses/${id}`, data),
    delete: (id) => api.delete(`/admin/expenses/${id}`),
};

export const floorsApi = {
    getAll: (params) => api.get('/admin/floors', { params }),
    get: (id) => api.get(`/admin/floors/${id}`),
    create: (data) => api.post('/admin/floors', data),
    update: (id, data) => api.put(`/admin/floors/${id}`, data),
    delete: (id) => api.delete(`/admin/floors/${id}`),
};

export const tablesApi = {
    getAll: (params) => api.get('/admin/tables', { params }),
    get: (id) => api.get(`/admin/tables/${id}`),
    create: (data) => api.post('/admin/tables', data),
    update: (id, data) => api.put(`/admin/tables/${id}`, data),
    delete: (id) => api.delete(`/admin/tables/${id}`),
    updateStatus: (id, status) => api.patch(`/admin/tables/${id}/status`, { status }),
};

export const invoicesApi = {
    getAll: (params) => api.get('/admin/invoices', { params }),
    get: (id) => api.get(`/admin/invoices/${id}`),
};

export const reservationsApi = {
    getAll: (params) => api.get('/admin/reservations', { params }),
    get: (id) => api.get(`/admin/reservations/${id}`),
    create: (data) => api.post('/admin/reservations', data),
    update: (id, data) => api.put(`/admin/reservations/${id}`, data),
    delete: (id) => api.delete(`/admin/reservations/${id}`),
};

export const settingsApi = {
    getAll: () => api.get('/admin/settings'),
    update: (data) => api.put('/admin/settings', data),
};

export const customerRequestsApi = {
    getAll: (params) => api.get('/admin/customer-requests', { params }),
    get: (id) => api.get(`/admin/customer-requests/${id}`),
    update: (id, data) => api.patch(`/admin/customer-requests/${id}`, data),
};