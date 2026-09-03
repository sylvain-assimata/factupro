import api from './axios';

export const inscription = (payload) => api.post('/auth/inscription/', payload);
export const connexion = (email, password) => api.post('/auth/connexion/', { email, password });
export const getMoi = () => api.get('/auth/moi/');
