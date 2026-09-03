import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getEquipe, inviterMembre, deleteMembre } from '../../api/entreprise';

const ROLE_LABELS = { proprietaire: 'Propriétaire', comptable: 'Comptable', membre: 'Membre' };
const ROLE_COLORS = {
  proprietaire: 'bg-gold-500/20 text-gold-500 border border-gold-500/30',
  comptable: 'bg-blue-100 text-blue-700',
  membre: 'bg-ink-100 text-ink-600',
};

const FORM_VIDE = { prenom: '', nom: '', email: '', password: '', role: 'membre' };

export default function Equipe() {
  const { utilisateur } = useAuth();
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_VIDE);

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await getEquipe();
      setEquipe(data);
    } catch {
      toast.error("Erreur de chargement de l'équipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email || !form.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSaving(true);
    try {
      await inviterMembre(form);
      toast.success('Membre ajouté avec succès');
      setShowForm(false);
      setForm(FORM_VIDE);
      charger();
    } catch (err) {
      toast.error(err?.response?.data?.email?.[0] || "Erreur lors de l'ajout du membre");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (m.id === utilisateur.id) { toast.error('Vous ne pouvez pas vous retirer vous-même'); return; }
    if (!window.confirm(`Retirer ${m.prenom} ${m.nom} de l'équipe ?`)) return;
    try {
      await deleteMembre(m.id);
      toast.success('Membre retiré');
      charger();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <Layout title="Équipe" subtitle="Gérez les accès de votre entreprise">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">

        <div className="flex justify-end">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="btn-hover h-9 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5">
            <Plus size={15} strokeWidth={2.5} /> Ajouter un membre
          </motion.button>
        </div>

        <div className="card-elegant overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-ink-400 text-sm">Chargement...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="elegant-th">Nom</th>
                  <th className="elegant-th">Email</th>
                  <th className="elegant-th">Rôle</th>
                  <th className="elegant-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipe.map((m) => (
                  <tr key={m.id} className="elegant-row border-b border-ink-100 last:border-0">
                    <td className="px-3.5 py-2.5 font-medium text-ink-800">{m.prenom} {m.nom}</td>
                    <td className="px-3.5 py-2.5 text-ink-500">{m.email}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      {m.role !== 'proprietaire' && (
                        <button onClick={() => handleDelete(m)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-red-500">
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      )}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-800 font-display flex items-center gap-2">
                  <UsersRound size={17} className="text-brand-600" /> Ajouter un membre
                </h2>
                <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-600"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Prénom</label>
                    <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Nom</label>
                    <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Mot de passe temporaire</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="6 caractères min."
                    className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Rôle</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="h-9 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="membre">Membre</option>
                    <option value="comptable">Comptable</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 h-9 border border-ink-200 rounded-md text-sm text-ink-600 hover:bg-ink-50">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 h-9 bg-brand-600 text-white rounded-md text-sm font-medium disabled:opacity-60">
                    {saving ? 'Ajout...' : 'Ajouter'}
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
