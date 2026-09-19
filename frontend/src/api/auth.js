import api from './axios';

export const inscription = (payload) => api.post('/auth/inscription/', payload);
export const connexion = (email, password) => api.post('/auth/connexion/', { email, password });
export const getMoi = () => api.get('/auth/moi/');
export const demanderReinitialisation = (email) => api.post('/auth/mot-de-passe-oublie/', { email });
export const confirmerReinitialisation = (payload) => api.post('/auth/reinitialiser-mot-de-passe/', payload);
