import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login/Login';
import MotDePasseOublie from './pages/MotDePasseOublie/MotDePasseOublie';
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse/ReinitialiserMotDePasse';
import Inscription from './pages/Inscription/Inscription';
import Dashboard from './pages/Dashboard/Dashboard';
import Clients from './pages/Clients/Clients';
import Devis from './pages/Devis/Devis';
import Factures from './pages/Factures/Factures';
import DetailFacture from './pages/Factures/DetailFacture';
import Equipe from './pages/Equipe/Equipe';
import Parametres from './pages/Parametres/Parametres';
import Abonnement from './pages/Abonnement/Abonnement';
import RetourAbonnement from './pages/Abonnement/RetourAbonnement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
          <Route path="/inscription" element={<Inscription />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute><Clients /></ProtectedRoute>
          } />
          <Route path="/devis" element={
            <ProtectedRoute><Devis /></ProtectedRoute>
          } />
          <Route path="/factures" element={
            <ProtectedRoute><Factures /></ProtectedRoute>
          } />
          <Route path="/factures/:id" element={
            <ProtectedRoute><DetailFacture /></ProtectedRoute>
          } />
          <Route path="/equipe" element={
            <ProtectedRoute roles={['proprietaire', 'comptable']}><Equipe /></ProtectedRoute>
          } />
          <Route path="/parametres" element={
            <ProtectedRoute><Parametres /></ProtectedRoute>
          } />
          <Route path="/abonnement" element={
            <ProtectedRoute><Abonnement /></ProtectedRoute>
          } />
          <Route path="/abonnement/retour" element={
            <ProtectedRoute><RetourAbonnement /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
