import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt, Building2, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Inscription() {
  const [form, setForm] = useState({
    nom_entreprise: '', prenom: '', nom: '', email: '', password: '', devise: 'XOF',
  });
  const [loading, setLoading] = useState(false);
  const { handleInscription } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom_entreprise || !form.prenom || !form.nom || !form.email || !form.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await handleInscription(form);
      toast.success('Bienvenue sur FactuPro !');
      navigate('/dashboard');
    } catch (err) {
      const detail = err?.response?.data?.email?.[0] || "Erreur lors de l'inscription";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-900 flex items-center justify-center p-4 py-10 font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 bg-200 animate-gradientShift" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/30 blur-3xl animate-floatSlow" />
      <div className="absolute -bottom-32 -left-16 w-[28rem] h-[28rem] rounded-full bg-gold-500/10 blur-3xl animate-floatSlower" />

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
          className="flex flex-col items-center mb-6"
        >
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-2xl bg-brand-400/30 blur-xl animate-pulseGlow" />
            <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Receipt size={26} strokeWidth={2} className="text-brand-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight font-display">FactuPro</h1>
          <p className="text-brand-200 text-xs mt-1">14 jours d'essai gratuit, sans carte bancaire</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 p-7"
        >
          <h2 className="text-lg font-semibold text-ink-800 font-display page-title inline-block mb-5">
            Créer mon espace
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 size={11} /> Nom de votre entreprise
              </label>
              <input
                value={form.nom_entreprise}
                onChange={set('nom_entreprise')}
                placeholder="ex: Atelier Kokou Design"
                className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={11} /> Prénom
                </label>
                <input
                  value={form.prenom}
                  onChange={set('prenom')}
                  className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Nom</label>
                <input
                  value={form.nom}
                  onChange={set('nom')}
                  className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={11} /> Adresse email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="vous@entreprise.com"
                className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock size={11} /> Mot de passe
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="6 caractères min."
                  className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Devise</label>
                <select
                  value={form.devise}
                  onChange={set('devise')}
                  className="h-10 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white"
                >
                  <option value="XOF">Franc CFA (XOF)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar (USD)</option>
                </select>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="h-10 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-md text-sm font-medium disabled:opacity-60 mt-2 shadow-md"
            >
              {loading ? 'Création en cours...' : 'Créer mon compte gratuitement'}
            </motion.button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
