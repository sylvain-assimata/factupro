import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getMonEntreprise, updateMonEntreprise } from '../../api/entreprise';

export default function Parametres() {
  const { setEntreprise } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMonEntreprise().then(({ data }) => setForm(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateMonEntreprise({
        nom: form.nom, email_contact: form.email_contact, telephone: form.telephone,
        adresse: form.adresse, ville: form.ville, pays: form.pays,
        numero_fiscal: form.numero_fiscal, devise: form.devise, taux_tva_defaut: form.taux_tva_defaut,
      });
      setEntreprise(data);
      toast.success('Informations mises à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return (
    <Layout title="Paramètres"><div className="text-center text-ink-400 text-sm py-20">Chargement...</div></Layout>
  );

  return (
    <Layout title="Paramètres" subtitle="Informations de votre entreprise">
      <div className="max-w-2xl mx-auto">
        <div className="card-elegant p-6">
          <h2 className="text-base font-semibold text-ink-800 font-display page-title inline-block mb-5 flex items-center gap-2">
            <Building2 size={17} className="text-brand-600" /> Mon entreprise
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Nom de l'entreprise</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Email de contact</label>
                <input value={form.email_contact} onChange={(e) => setForm({ ...form, email_contact: e.target.value })}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">N° fiscal (NIF)</label>
                <input value={form.numero_fiscal} onChange={(e) => setForm({ ...form, numero_fiscal: e.target.value })}
                  className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Devise</label>
                <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  className="h-9 border border-ink-200 rounded-md px-2 text-sm outline-none focus:border-brand-400 bg-white">
                  <option value="XOF">Franc CFA (XOF)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar (USD)</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-ink-500 uppercase tracking-wide">Taux TVA par défaut (%)</label>
              <input type="number" min="0" step="0.1" value={form.taux_tva_defaut} onChange={(e) => setForm({ ...form, taux_tva_defaut: e.target.value })}
                className="h-9 border border-ink-200 rounded-md px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 max-w-[140px]" />
            </div>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
              className="self-start h-9 px-5 bg-brand-600 text-white rounded-md text-sm font-medium disabled:opacity-60 inline-flex items-center gap-1.5 mt-2">
              <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </motion.button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
