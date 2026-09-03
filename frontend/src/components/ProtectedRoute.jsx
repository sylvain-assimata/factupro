import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, utilisateur, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles.length > 0 && !roles.includes(utilisateur?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
