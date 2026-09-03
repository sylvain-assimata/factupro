import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connexion, inscription, getMoi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);

  const chargerProfil = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await getMoi();
      setUtilisateur(data.utilisateur);
      setEntreprise(data.entreprise);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerProfil();
  }, [chargerProfil]);

  const handleLogin = async (email, password) => {
    const { data } = await connexion(email, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUtilisateur(data.utilisateur);
    setEntreprise(data.entreprise);
    return data;
  };

  const handleInscription = async (payload) => {
    const { data } = await inscription(payload);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUtilisateur(data.utilisateur);
    setEntreprise(data.entreprise);
    return data;
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUtilisateur(null);
    setEntreprise(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!utilisateur;

  const estProprietaireOuComptable = () =>
    utilisateur && ['proprietaire', 'comptable'].includes(utilisateur.role);

  return (
    <AuthContext.Provider
      value={{
        utilisateur,
        entreprise,
        setEntreprise,
        loading,
        isAuthenticated,
        handleLogin,
        handleInscription,
        handleLogout,
        estProprietaireOuComptable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
