import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import { getClients, createClient, updateClient, deleteClient } from '../../api/clients';

const CLIENT_VIDE = { nom: '', email: '', telephone: '', adresse: '', ville: '', pays: 'Togo', numero_fiscal: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(CLIENT_VIDE);
  const [saving, setSaving] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await getClients(recherche);
      setClients(data);
    } catch {
      toast.error('Erreur de chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(charger, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const ouvrirNouveau = () => {
    setSelected(null);
    setForm(CLIENT_VIDE);
    setShowForm(true);
  };

  const ouvrirEdition = (c) => {
    setSelected(c);
    setForm({ ...CLIENT_VIDE, ...c });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) {
      toast.error('Le nom du client est requis');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await updateClient(selected.id, form);
        toast.success('Client mis à jour');
      } else {
        await createClient(form);
        toast.success('Client créé');
      }
      setShowForm(false);
      charger();
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Supprimer le client "${c.nom}" ?`)) return;
    try {
      await deleteClient(c.id);
      toast.success('Client supprimé');
      charger();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <Layout title="Clients" subtitle="Répertoire de vos clients">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full h-9 pl-8 pr-3 border border-ink-200 rounded-lg text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            />
          </div>
          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={ouvrirNouveau}
            className="btn-hover h-9 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5 justify-center"
          >
            <Plus size={15} strokeWidth={2.5} /> Nouveau client
          </motion.button>
        </div>

        <div className="card-elegant overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-ink-400 text-sm">Chargement...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-ink-400 text-sm">Aucun client trouvé</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="elegant-th">Nom</th>
                  <th className="elegant-th">Email</th>
                  <th className="elegant-th">Téléphone</th>
                  <th className="elegant-th">Ville</th>
                  <th className="elegant-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="elegant-row border-b border-ink-100 last:border-0">
                    <td className="px-3.5 py-2.5 font-medium text-ink-800">{c.nom}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{c.email || '—'}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{c.telephone || '—'}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{c.ville || '—'}</td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => ouvrirEdition(c)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-ink-100 text-ink-500">
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        <button onClick={() => handleDelete(c)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-red-500">
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-ink-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-800 font-display">
                  {selected ? 'Modifier le client' : 'Nouveau client'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Nom *</label>
                  <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Email</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Téléphone</label>
                    <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Adresse</label>
                  <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Ville</label>
                    <input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Pays</label>
                    <input value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">N° fiscal</label>
                  <input value={form.numero_fiscal} onChange={(e) => setForm({ ...form, numero_fiscal: e.target.value })}
                    className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
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
