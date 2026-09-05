import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Wallet, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getUneFacture, createPaiement, getFacturePDF } from '../../api/facturation';
import { telechargerPdf } from '../../utils/downloadPdf';

function formatMontant(n, devise = 'XOF') {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0) + ' ' + devise;
}

const STATUT_LABELS = {
  brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée',
  partielle: 'Partielle', retard: 'En retard', annulee: 'Annulée',
};
const STATUT_COLORS = {
  brouillon: 'bg-ink-100 text-ink-600', envoyee: 'bg-blue-100 text-blue-700',
  payee: 'bg-green-100 text-green-700', partielle: 'bg-amber-100 text-amber-700',
  retard: 'bg-red-100 text-red-700', annulee: 'bg-ink-100 text-ink-400',
};
const MODE_LABELS = {
  especes: 'Espèces', mobile_money: 'Mobile Money', virement: 'Virement bancaire',
  cheque: 'Chèque', carte: 'Carte bancaire',
};

export default function DetailFacture() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entreprise } = useAuth();
  const devise = entreprise?.devise || 'XOF';

  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaiement, setShowPaiement] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paiementForm, setPaiementForm] = useState({ montant: '', mode: 'especes', reference: '', note: '' });

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await getUneFacture(id);
      setFacture(data);
    } catch {
      toast.error('Facture introuvable');
      navigate('/factures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); /* eslint-disable-next-line */ }, [id]);

  const handlePaiement = async (e) => {
    e.preventDefault();
    if (!paiementForm.montant || Number(paiementForm.montant) <= 0) {
      toast.error('Montant invalide');
      return;
    }
    setSaving(true);
    try {
      await createPaiement(id, paiementForm);
      toast.success('Paiement enregistré');
      setShowPaiement(false);
      setPaiementForm({ montant: '', mode: 'especes', reference: '', note: '' });
      charger();
    } catch {
      toast.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout title="Chargement..."><div className="text-center text-ink-400 text-sm py-20">Chargement...</div></Layout>
  );
  if (!facture) return null;

  return (
    <Layout title={facture.numero} subtitle={facture.client_nom}>
      <div className="max-w-3xl mx-auto flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/factures')} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
            <ArrowLeft size={15} /> Retour aux factures
          </button>
          <button
            onClick={async () => {
              try {
                const res = await getFacturePDF(facture.id);
                telechargerPdf(res.data, facture.numero);
              } catch {
                toast.error('Erreur lors du téléchargement du PDF');
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 font-medium"
          >
            <Download size={15} /> Télécharger le PDF
          </button>
        </div>

        <div className="card-elegant p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-ink-800 font-display page-title inline-block">{facture.numero}</h2>
              <p className="text-sm text-ink-500 mt-2">{facture.client_nom}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUT_COLORS[facture.statut]}`}>
              {STATUT_LABELS[facture.statut]}
            </span>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr>
                <th className="elegant-th">Désignation</th>
                <th className="elegant-th text-right">Qté</th>
                <th className="elegant-th text-right">P.U. HT</th>
                <th className="elegant-th text-right">TVA</th>
                <th className="elegant-th text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {facture.lignes.map((l) => (
                <tr key={l.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-3.5 py-2.5 text-ink-700">{l.designation}</td>
                  <td className="px-3.5 py-2.5 text-right text-ink-500">{l.quantite}</td>
                  <td className="px-3.5 py-2.5 text-right text-ink-500">{formatMontant(l.prix_unitaire_ht, devise)}</td>
                  <td className="px-3.5 py-2.5 text-right text-ink-500">{l.taux_tva}%</td>
                  <td className="px-3.5 py-2.5 text-right text-ink-800 font-medium">{formatMontant(l.total_ligne_ttc, devise)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-ink-500"><span>Total HT</span><span>{formatMontant(facture.total_ht, devise)}</span></div>
              <div className="flex justify-between text-ink-500"><span>Total TVA</span><span>{formatMontant(facture.total_tva, devise)}</span></div>
              <div className="flex justify-between text-ink-800 font-semibold border-t border-ink-200 pt-1"><span>Total TTC</span><span>{formatMontant(facture.total_ttc, devise)}</span></div>
              <div className="flex justify-between text-green-600"><span>Déjà payé</span><span>{formatMontant(facture.total_paye, devise)}</span></div>
              <div className="flex justify-between text-red-600 font-semibold"><span>Solde restant</span><span>{formatMontant(facture.solde_restant, devise)}</span></div>
            </div>
          </div>
        </div>

        <div className="card-elegant overflow-hidden">
          <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-800 font-display flex items-center gap-2">
              <Wallet size={16} className="text-gold-500" /> Paiements
            </span>
            {Number(facture.solde_restant) > 0 && (
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowPaiement(true)}
                className="h-8 px-3 bg-brand-600 text-white rounded-md text-xs font-medium inline-flex items-center gap-1.5">
                <Plus size={13} /> Enregistrer un paiement
              </motion.button>
            )}
          </div>
          {facture.paiements.length === 0 ? (
            <div className="p-6 text-center text-ink-400 text-sm">Aucun paiement enregistré</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="elegant-th">Date</th>
                  <th className="elegant-th">Montant</th>
                  <th className="elegant-th">Mode</th>
                  <th className="elegant-th">Référence</th>
                </tr>
              </thead>
              <tbody>
                {facture.paiements.map((p) => (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0">
                    <td className="px-3.5 py-2.5 text-ink-500">{p.date_paiement}</td>
                    <td className="px-3.5 py-2.5 font-medium text-green-600">{formatMontant(p.montant, devise)}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{MODE_LABELS[p.mode]}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{p.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPaiement && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaiement(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-800 font-display">Enregistrer un paiement</h2>
                <button onClick={() => setShowPaiement(false)} className="text-ink-400 hover:text-ink-600"><X size={18} /></button>
              </div>
              <form onSubmit={handlePaiement} className="p-6 flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Montant (solde: {formatMontant(facture.solde_restant, devise)})</label>
                  <input type="number" min="0" step="1" value={paiementForm.montant}
                    onChange={(e) => setPaiementForm({ ...paiementForm, montant: e.target.value })}
                    className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Mode de paiement</label>
                  <select value={paiementForm.mode} onChange={(e) => setPaiementForm({ ...paiementForm, mode: e.target.value })}
                    className="h-10 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400 bg-white">
                    {Object.entries(MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Référence</label>
                  <input value={paiementForm.reference} onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
                    placeholder="N° transaction, chèque..."
                    className="h-10 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowPaiement(false)}
                    className="flex-1 h-9 border border-ink-200 rounded-md text-sm text-ink-600 hover:bg-ink-50">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 h-9 bg-brand-600 text-white rounded-md text-sm font-medium disabled:opacity-60">
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
