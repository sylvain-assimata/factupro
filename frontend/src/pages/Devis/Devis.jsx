import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Trash2, X, ArrowRightCircle, FileSignature, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getClients } from '../../api/clients';
import { getDevis, createDevis, deleteDevis, convertirDevisEnFacture, getDevisPDF } from '../../api/facturation';
import { telechargerPdf } from '../../utils/downloadPdf';

function formatMontant(n, devise = 'XOF') {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0) + ' ' + devise;
}

const STATUT_LABELS = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré',
};
const STATUT_COLORS = {
  brouillon: 'bg-ink-100 text-ink-600', envoye: 'bg-blue-100 text-blue-700',
  accepte: 'bg-green-100 text-green-700', refuse: 'bg-red-100 text-red-700',
  expire: 'bg-amber-100 text-amber-700',
};

const LIGNE_VIDE = { designation: '', quantite: 1, prix_unitaire_ht: 0, taux_tva: 18 };

export default function Devis() {
  const { entreprise } = useAuth();
  const devise = entreprise?.devise || 'XOF';
  const [devisListe, setDevisListe] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ client: '', objet: '', date_validite: '', notes: '', lignes: [{ ...LIGNE_VIDE }] });

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await getDevis({ recherche });
      setDevisListe(data);
    } catch {
      toast.error('Erreur de chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getClients().then(({ data }) => setClients(data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(charger, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const ouvrirNouveau = () => {
    setForm({ client: '', objet: '', date_validite: '', notes: '', lignes: [{ ...LIGNE_VIDE }] });
    setShowForm(true);
  };

  const majLigne = (i, key, value) => {
    const lignes = [...form.lignes];
    lignes[i] = { ...lignes[i], [key]: value };
    setForm({ ...form, lignes });
  };

  const ajouterLigne = () => setForm({ ...form, lignes: [...form.lignes, { ...LIGNE_VIDE }] });
  const supprimerLigne = (i) => setForm({ ...form, lignes: form.lignes.filter((_, idx) => idx !== i) });

  const totalHT = form.lignes.reduce((acc, l) => acc + (Number(l.quantite) * Number(l.prix_unitaire_ht) || 0), 0);
  const totalTVA = form.lignes.reduce((acc, l) => acc + ((Number(l.quantite) * Number(l.prix_unitaire_ht) || 0) * (Number(l.taux_tva) / 100)), 0);
  const totalTTC = totalHT + totalTVA;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client) { toast.error('Sélectionnez un client'); return; }
    if (form.lignes.length === 0 || !form.lignes.some(l => l.designation)) { toast.error('Ajoutez au moins une ligne'); return; }
    setSaving(true);
    try {
      await createDevis(form);
      toast.success('Devis créé');
      setShowForm(false);
      charger();
    } catch {
      toast.error("Erreur lors de la création du devis");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertir = async (d) => {
    if (!window.confirm(`Convertir le devis ${d.numero} en facture ?`)) return;
    try {
      await convertirDevisEnFacture(d.id);
      toast.success('Devis converti en facture !');
      charger();
    } catch {
      toast.error('Erreur lors de la conversion');
    }
  };

  const handleTelechargerPdf = async (d) => {
    try {
      const res = await getDevisPDF(d.id);
      telechargerPdf(res.data, d.numero);
    } catch {
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Supprimer le devis ${d.numero} ?`)) return;
    try {
      await deleteDevis(d.id);
      toast.success('Devis supprimé');
      charger();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <Layout title="Devis" subtitle="Vos propositions commerciales">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un devis, un client..."
              className="w-full h-9 pl-8 pr-3 border border-ink-200 rounded-lg text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            />
          </div>
          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={ouvrirNouveau}
            className="btn-hover h-9 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5 justify-center"
          >
            <Plus size={15} strokeWidth={2.5} /> Nouveau devis
          </motion.button>
        </div>

        <div className="card-elegant overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-ink-400 text-sm">Chargement...</div>
          ) : devisListe.length === 0 ? (
            <div className="p-8 text-center text-ink-400 text-sm">Aucun devis trouvé</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="elegant-th">N° Devis</th>
                  <th className="elegant-th">Client</th>
                  <th className="elegant-th">Objet</th>
                  <th className="elegant-th">Statut</th>
                  <th className="elegant-th">Total TTC</th>
                  <th className="elegant-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devisListe.map((d) => (
                  <tr key={d.id} className="elegant-row border-b border-ink-100 last:border-0">
                    <td className="px-3.5 py-2.5 font-medium text-ink-800">{d.numero}</td>
                    <td className="px-3.5 py-2.5 text-ink-600">{d.client_nom}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{d.objet || '—'}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[d.statut]}`}>
                        {STATUT_LABELS[d.statut]}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-ink-700 font-medium">{formatMontant(d.total_ttc, devise)}</td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleTelechargerPdf(d)} title="Télécharger le PDF"
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-brand-50 text-brand-600">
                          <Download size={14} strokeWidth={2} />
                        </button>
                        {d.statut !== 'accepte' && (
                          <button onClick={() => handleConvertir(d)} title="Convertir en facture"
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-green-50 text-green-600">
                            <ArrowRightCircle size={15} strokeWidth={2} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(d)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-red-500">
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-ink-100 flex items-center justify-between z-10">
                <h2 className="text-base font-semibold text-ink-800 font-display flex items-center gap-2">
                  <FileSignature size={17} className="text-brand-600" /> Nouveau devis
                </h2>
                <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Client *</label>
                    <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 bg-white">
                      <option value="">— Choisir —</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Date de validité</label>
                    <input type="date" value={form.date_validite} onChange={(e) => setForm({ ...form, date_validite: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Objet</label>
                  <input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })}
                    placeholder="ex: Refonte du site vitrine"
                    className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>

                {/* Lignes */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Lignes du devis</label>
                  {form.lignes.map((l, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={l.designation} onChange={(e) => majLigne(i, 'designation', e.target.value)}
                        placeholder="Désignation" className="col-span-5 h-9 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400" />
                      <input type="number" min="0" step="0.01" value={l.quantite} onChange={(e) => majLigne(i, 'quantite', e.target.value)}
                        placeholder="Qté" className="col-span-2 h-9 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400" />
                      <input type="number" min="0" step="1" value={l.prix_unitaire_ht} onChange={(e) => majLigne(i, 'prix_unitaire_ht', e.target.value)}
                        placeholder="P.U. HT" className="col-span-3 h-9 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400" />
                      <input type="number" min="0" step="0.1" value={l.taux_tva} onChange={(e) => majLigne(i, 'taux_tva', e.target.value)}
                        placeholder="TVA %" className="col-span-1 h-9 border border-ink-200 rounded-md px-1 text-sm outline-none focus:border-brand-400" />
                      <button type="button" onClick={() => supprimerLigne(i)} className="col-span-1 h-9 flex items-center justify-center text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={ajouterLigne}
                    className="self-start text-xs text-brand-600 font-medium hover:underline mt-1">
                    + Ajouter une ligne
                  </button>
                </div>

                {/* Totaux */}
                <div className="bg-ink-50 rounded-lg p-3 flex flex-col gap-1 text-sm">
                  <div className="flex justify-between text-ink-500"><span>Total HT</span><span>{formatMontant(totalHT, devise)}</span></div>
                  <div className="flex justify-between text-ink-500"><span>Total TVA</span><span>{formatMontant(totalTVA, devise)}</span></div>
                  <div className="flex justify-between text-ink-800 font-semibold border-t border-ink-200 pt-1 mt-1"><span>Total TTC</span><span>{formatMontant(totalTTC, devise)}</span></div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="border border-ink-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 h-9 border border-ink-200 rounded-md text-sm text-ink-600 hover:bg-ink-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 h-9 bg-brand-600 text-white rounded-md text-sm font-medium disabled:opacity-60">
                    {saving ? 'Création...' : 'Créer le devis'}
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
