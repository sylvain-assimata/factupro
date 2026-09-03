import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await handleLogin(email, password);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch {
      toast.error('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-900 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 bg-200 animate-gradientShift" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-500/30 blur-3xl animate-floatSlow" />
      <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-gold-500/10 blur-3xl animate-floatSlower" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-brand-400/30 blur-xl animate-pulseGlow" />
            <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Receipt size={30} strokeWidth={2} className="text-brand-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">FactuPro</h1>
          <p className="text-brand-200 text-xs mt-1">Facturation & comptabilité simplifiées</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 p-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink-800 font-display page-title inline-block mb-2">
              Connexion
            </h2>
            <p className="text-xs text-ink-400 mt-2">Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 border border-ink-200 rounded-md px-3 pr-10 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-transform hover:scale-110"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -2, boxShadow: '0 10px 20px -6px rgba(79,70,229,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="h-10 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60 mt-2 shadow-md"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </motion.button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-brand-600 font-medium hover:underline">
              Créer mon espace
            </Link>
          </p>
        </motion.div>

        <p className="text-center text-[10px] text-white/50 mt-6">
          © 2026 FactuPro · Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
}
