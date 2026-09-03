import api from './axios';

export const getMonEntreprise = () => api.get('/entreprise/');
export const updateMonEntreprise = (payload) => api.patch('/entreprise/', payload);

export const getEquipe = () => api.get('/utilisateurs/');
export const inviterMembre = (payload) => api.post('/utilisateurs/', payload);
export const updateMembre = (id, payload) => api.patch(`/utilisateurs/${id}/`, payload);
export const deleteMembre = (id) => api.delete(`/utilisateurs/${id}/`);
