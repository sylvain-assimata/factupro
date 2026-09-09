import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getPlans, initierAbonnement, getMonEntreprise } from '../../api/entreprise';

const PLAN_ICONS = { starter: Sparkles, pro: CreditCard };

export default function Abonnement() {
  const { entreprise, setEntreprise } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    getPlans().then(({ data }) => setPlans(data));
    getMonEntreprise().then(({ data }) => setEntreprise(data));
  }, []);

  const handleAbonner = async (planCode) => {
    setLoadingPlan(planCode);
    try {
      const { data } = await initierAbonnement(planCode);
      // Redirection vers la page de paiement sécurisée FedaPay (Mobile Money / carte)
      window.location.href = data.url;
    } catch (err) {
      const message = err?.response?.data?.detail || "Erreur lors de l'initialisation du paiement";
      toast.error(message);
      setLoadingPlan(null);
    }
  };

  const planActuelLabel = { essai: 'Essai gratuit', starter: 'Starter', pro: 'Pro' }[entreprise?.plan] || entreprise?.plan;

  return (
    <Layout title="Abonnement" subtitle="Choisissez le plan adapté à votre activité">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        <div className="card-elegant p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-medium text-ink-500 uppercase tracking-wide mb-1">Plan actuel</div>
            <div className="text-lg font-semibold text-ink-800 font-display">{planActuelLabel}</div>
            {entreprise?.plan === 'essai' && entreprise?.date_fin_essai && (
              <div className="text-xs text-ink-500 mt-1">
                Essai gratuit jusqu'au {new Date(entreprise.date_fin_essai).toLocaleDateString('fr-FR')}
              </div>
            )}
            {entreprise?.plan !== 'essai' && entreprise?.date_fin_abonnement && (
              <div className="text-xs text-ink-500 mt-1">
                Actif jusqu'au {new Date(entreprise.date_fin_abonnement).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
            <CreditCard size={20} className="text-brand-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {plans.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.code] || Sparkles;
            const estPlanActuel = entreprise?.plan === plan.code;
            return (
              <motion.div
                key={plan.code}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                className="card-elegant p-6 flex flex-col gap-4 relative overflow-hidden"
              >
                {plan.code === 'pro' && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                    Populaire
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink-800 font-display">{plan.nom}</h3>
                  <p className="text-xs text-ink-500 mt-1">{plan.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-ink-800 font-display">
                    {plan.prix.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-ink-500">FCFA / {plan.periode}</span>
                </div>
                <button
                  disabled={estPlanActuel || loadingPlan === plan.code}
                  onClick={() => handleAbonner(plan.code)}
                  className="h-10 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2
                    disabled:opacity-60 disabled:cursor-not-allowed
                    bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800"
                >
                  {loadingPlan === plan.code ? (
                    <><Loader2 size={15} className="animate-spin" /> Redirection...</>
                  ) : estPlanActuel ? (
                    <><Check size={15} /> Plan actuel</>
                  ) : (
                    'Payer avec Mobile Money'
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[11px] text-ink-400 text-center">
          Paiement sécurisé via FedaPay (Mobile Money, carte bancaire). Vous serez redirigé vers une page de paiement sécurisée.
        </p>
      </div>
    </Layout>
  );
}
