import api from './axios';

// Devis
export const getDevis = (params = {}) => api.get('/devis/', { params });
export const getUnDevis = (id) => api.get(`/devis/${id}/`);
export const createDevis = (payload) => api.post('/devis/', payload);
export const updateDevis = (id, payload) => api.put(`/devis/${id}/`, payload);
export const deleteDevis = (id) => api.delete(`/devis/${id}/`);
export const convertirDevisEnFacture = (id) => api.post(`/devis/${id}/convertir/`);

// Factures
export const getFactures = (params = {}) => api.get('/factures/', { params });
export const getUneFacture = (id) => api.get(`/factures/${id}/`);
export const createFacture = (payload) => api.post('/factures/', payload);
export const updateFacture = (id, payload) => api.put(`/factures/${id}/`, payload);
export const deleteFacture = (id) => api.delete(`/factures/${id}/`);

// Paiements
export const getPaiements = (factureId) => api.get(`/factures/${factureId}/paiements/`);
export const createPaiement = (factureId, payload) => api.post(`/factures/${factureId}/paiements/`, payload);

// Statistiques
export const getStatistiques = () => api.get('/statistiques/');
