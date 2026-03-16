import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    Accept: 'application/json',
  },
});

export const sourceApi = {
  inspectSheet: (payload) => api.post('/api/sources/inspect-sheet', payload),
  previewSheet: (payload) => api.post('/api/sources/preview', payload),
  getAll: () => api.get('/api/sources'),
  createSource: (payload) => api.post('/api/sources', payload),
  update: (id, payload) => api.put(`/api/sources/${id}`, payload),
  delete: (id) => api.delete(`/api/sources/${id}`),
  getSchemaFields: (params) => api.get('/api/schema-fields', { params }),
  getMappings: (sourceId) => api.get(`/api/mappings/${sourceId}`),
  saveMappings: (sourceId, payload) => api.put(`/api/mappings/${sourceId}`, payload),
  syncNow: (sourceId) => api.post(`/api/sync/${sourceId}`),
};

export const investorApi = {
  getAll: () => api.get('/api/investors'),
  create: (payload) => api.post('/api/investors', payload),
  update: (id, payload) => api.put(`/api/investors/${id}`, payload),
  delete: (id) => api.delete(`/api/investors/${id}`),
};

export const projectApi = {
  getAll: () => api.get('/api/projects'),
  create: (payload) => api.post('/api/projects', payload),
  update: (id, payload) => api.put(`/api/projects/${id}`, payload),
  delete: (id) => api.delete(`/api/projects/${id}`),
};

export const agencyApi = {
  getAll: () => api.get('/api/agencies'),
  create: (payload) => api.post('/api/agencies', payload),
  update: (id, payload) => api.put(`/api/agencies/${id}`, payload),
  delete: (id) => api.delete(`/api/agencies/${id}`),
};

export const schemaApi = {
  getAll: (params) => api.get('/api/schemas', { params }),
  getDetail: (id) => api.get(`/api/schemas/${id}`),
  create: (payload) => api.post('/api/schemas', payload),
  update: (id, payload) => api.put(`/api/schemas/${id}`, payload),
  delete: (id) => api.delete(`/api/schemas/${id}`),
};

export const schemaFieldApi = {
  getAll: (params) => api.get('/api/schema-fields', { params }),
  getDetail: (id) => api.get(`/api/schema-fields/${id}`),
  attach: (payload) => api.post('/api/schema-fields/attach', payload),
  create: (payload) => api.post('/api/schema-fields', payload),
  update: (id, payload) => api.put(`/api/schema-fields/${id}`, payload),
  delete: (id) => api.delete(`/api/schema-fields/${id}`),
};

export const fieldCatalogApi = {
  getAll: (params) => api.get('/api/field-catalogs', { params }),
  create: (payload) => api.post('/api/field-catalogs', payload),
  update: (id, payload) => api.put(`/api/field-catalogs/${id}`, payload),
  delete: (id) => api.delete(`/api/field-catalogs/${id}`),
};

export const unitApi = {
  getAll: (params) => api.get('/api/units', { params }),
  getDetail: (id) => api.get(`/api/units/${id}`),
  create: (payload) => api.post('/api/units', payload),
  update: (id, payload) => api.put(`/api/units/${id}`, payload),
  delete: (id) => api.delete(`/api/units/${id}`),
};

export default api;
