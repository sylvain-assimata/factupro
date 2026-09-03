import api from './axios';

export const getClients = (recherche = '') => api.get('/clients/', { params: { recherche } });
export const getClient = (id) => api.get(`/clients/${id}/`);
export const createClient = (payload) => api.post('/clients/', payload);
export const updateClient = (id, payload) => api.put(`/clients/${id}/`, payload);
export const deleteClient = (id) => api.delete(`/clients/${id}/`);
