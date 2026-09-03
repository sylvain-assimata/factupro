import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, FileSignature, Receipt, Wallet, AlertTriangle, TrendingUp,
  Plus, ArrowRight, Zap,
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getStatistiques } from '../../api/facturation';
import { getFactures } from '../../api/facturation';

function formatMontant(n, devise = 'XOF') {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0) + ' ' + devise;
}

export default function Dashboard() {
  const { utilisateur, entreprise } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [dernieresFactures, setDernieresFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, f] = await Promise.all([getStatistiques(), getFactures()]);
        setStats(s.data);
        setDernieresFactures(f.data.slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const devise = entreprise?.devise || 'XOF';

  const cartes = stats ? [
    { label: 'Clients', value: stats.nb_clients, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Devis', value: stats.nb_devis, icon: FileSignature, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Factures', value: stats.nb_factures, icon: Receipt, bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { label: 'Impayées', value: stats.nb_factures_impayees, icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
  ] : [];

  const actions = [
    { label: 'Nouveau client', icon: Plus, path: '/clients', color: 'bg-blue-50 text-blue-700' },
    { label: 'Nouveau devis', icon: FileSignature, path: '/devis', color: 'bg-purple-50 text-purple-700' },
    { label: 'Nouvelle facture', icon: Receipt, path: '/factures', color: 'bg-indigo-50 text-indigo-700' },
  ];

  const STATUT_LABELS = {
    brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée',
    partielle: 'Partielle', retard: 'En retard', annulee: 'Annulée',
  };
  const STATUT_COLORS = {
    brouillon: 'bg-ink-100 text-ink-600', envoyee: 'bg-blue-100 text-blue-700',
    payee: 'bg-green-100 text-green-700', partielle: 'bg-amber-100 text-amber-700',
    retard: 'bg-red-100 text-red-700', annulee: 'bg-ink-100 text-ink-400',
  };

  return (
    <Layout title="Tableau de bord" subtitle={`Bienvenue, ${utilisateur?.prenom}`}>
      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Chargement...</div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* Bannière de bienvenue */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden bg-gradient-to-r from-brand-800 to-brand-600 bg-200 animate-gradientShift rounded-xl p-5 text-white"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-floatSlow pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={22} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-lg font-medium font-display">
                    Bonjour {utilisateur?.prenom} !
                  </div>
                  <div className="text-sm text-brand-100 mt-0.5">
                    {entreprise?.nom} · Solde impayé : {formatMontant(stats?.total_impaye, devise)}
                  </div>
                </div>
              </div>
              {entreprise?.plan === 'essai' && (
                <div className="hidden sm:block text-[11px] bg-white/15 px-3 py-1.5 rounded-full font-medium">
                  Essai gratuit jusqu'au {entreprise?.date_fin_essai}
                </div>
              )}
            </div>
          </motion.div>

          {/* Cartes stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cartes.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                className={`${c.bg} card-hover rounded-xl p-4 border border-ink-100`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium">{c.label}</div>
                  <c.icon size={18} strokeWidth={2} className={c.color} />
                </div>
                <div className={`text-2xl font-bold font-display ${c.color}`}>{c.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Total facturé / encaissé */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="card-elegant p-4">
              <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium mb-1">Total facturé</div>
              <div className="text-xl font-bold font-display text-ink-800">{formatMontant(stats?.total_facture, devise)}</div>
            </div>
            <div className="card-elegant p-4">
              <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium mb-1">Total encaissé</div>
              <div className="text-xl font-bold font-display text-green-600">{formatMontant(stats?.total_encaisse, devise)}</div>
            </div>
            <div className="card-elegant p-4">
              <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium mb-1">Solde impayé</div>
              <div className="text-xl font-bold font-display text-red-600">{formatMontant(stats?.total_impaye, devise)}</div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card-elegant overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
              <Zap size={16} strokeWidth={2} className="text-gold-500" />
              <span className="text-sm font-semibold text-ink-800 font-display">Actions rapides</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {actions.map((a, i) => (
                <motion.button
                  key={a.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(a.path)}
                  className={`${a.color} h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 border border-ink-100 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <a.icon size={20} strokeWidth={2} />
                  <span className="text-xs font-medium">{a.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Dernières factures */}
          <div className="card-elegant overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-800 font-display flex items-center gap-2">
                <Receipt size={16} strokeWidth={2} className="text-gold-500" />
                Dernières factures
              </span>
            </div>
            {dernieresFactures.length === 0 ? (
              <div className="p-8 text-center text-ink-400 text-sm">Aucune facture pour le moment</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="elegant-th">N° Facture</th>
                    <th className="elegant-th">Client</th>
                    <th className="elegant-th">Statut</th>
                    <th className="elegant-th">Total TTC</th>
                    <th className="elegant-th">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dernieresFactures.map((f) => (
                    <tr key={f.id} className="elegant-row border-b border-ink-100 last:border-0">
                      <td className="px-3.5 py-2.5 font-medium text-ink-800">{f.numero}</td>
                      <td className="px-3.5 py-2.5 text-ink-600">{f.client_nom}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[f.statut]}`}>
                          {STATUT_LABELS[f.statut]}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-ink-700 font-medium">{formatMontant(f.total_ttc, devise)}</td>
                      <td className="px-3.5 py-2.5">
                        <button
                          onClick={() => navigate(`/factures/${f.id}`)}
                          className="h-6 px-2 bg-brand-50 text-brand-700 rounded text-[10px] border border-brand-200 hover:bg-brand-100 inline-flex items-center gap-1"
                        >
                          Ouvrir <ArrowRight size={11} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
