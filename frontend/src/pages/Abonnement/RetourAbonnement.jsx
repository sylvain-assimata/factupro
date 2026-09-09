import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { verifierAbonnement, getMonEntreprise } from '../../api/entreprise';

export default function RetourAbonnement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setEntreprise } = useAuth();
  const [statut, setStatut] = useState('verification'); // verification | paye | echoue | attente

  const abonnementId = searchParams.get('abonnement_id');

  useEffect(() => {
    if (!abonnementId) {
      setStatut('echoue');
      return;
    }
    verifierAbonnement(abonnementId)
      .then(({ data }) => {
        if (data.statut === 'paye') {
          setStatut('paye');
          getMonEntreprise().then(({ data: ent }) => setEntreprise(ent));
        } else if (data.statut === 'en_attente') {
          setStatut('attente');
        } else {
          setStatut('echoue');
        }
      })
      .catch(() => setStatut('echoue'));
  }, [abonnementId]);

  return (
    <Layout title="Abonnement" subtitle="Confirmation du paiement">
      <div className="max-w-md mx-auto card-elegant p-8 flex flex-col items-center text-center gap-4 mt-10">
        {statut === 'verification' && (
          <>
            <Loader2 size={40} className="animate-spin text-brand-600" />
            <h2 className="text-base font-semibold text-ink-800">Vérification du paiement...</h2>
            <p className="text-xs text-ink-500">Merci de patienter quelques secondes.</p>
          </>
        )}
        {statut === 'paye' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4">
            <CheckCircle2 size={44} className="text-green-500" />
            <h2 className="text-lg font-semibold text-ink-800 font-display">Paiement confirmé !</h2>
            <p className="text-sm text-ink-500">Votre abonnement est maintenant actif. Merci pour votre confiance.</p>
            <button onClick={() => navigate('/dashboard')}
              className="h-10 px-6 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium mt-2">
              Retour au tableau de bord
            </button>
          </motion.div>
        )}
        {statut === 'attente' && (
          <>
            <Loader2 size={40} className="text-amber-500" />
            <h2 className="text-base font-semibold text-ink-800">Paiement en attente</h2>
            <p className="text-xs text-ink-500">
              Votre paiement n'a pas encore été confirmé. Si vous venez de valider sur votre téléphone, patientez quelques instants puis réessayez.
            </p>
            <button onClick={() => window.location.reload()}
              className="h-9 px-5 rounded-md border border-ink-200 text-sm font-medium text-ink-700 mt-2">
              Revérifier
            </button>
          </>
        )}
        {statut === 'echoue' && (
          <>
            <XCircle size={44} className="text-red-500" />
            <h2 className="text-base font-semibold text-ink-800">Paiement non abouti</h2>
            <p className="text-xs text-ink-500">Le paiement a été annulé ou refusé. Vous pouvez réessayer à tout moment.</p>
            <button onClick={() => navigate('/abonnement')}
              className="h-10 px-6 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium mt-2">
              Retour aux plans
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
