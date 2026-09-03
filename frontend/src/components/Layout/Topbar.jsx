import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, subtitle }) {
  const { utilisateur } = useAuth();
  const initiales = utilisateur ? `${utilisateur.prenom[0]}${utilisateur.nom[0]}` : 'U';

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-white h-14 px-5 flex items-center justify-between border-b border-ink-100 flex-shrink-0">
      <div>
        <div className="text-sm font-semibold text-ink-800 font-display">{title}</div>
        <div className="text-[10px] text-ink-400">{subtitle || today}</div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-[10px] text-ink-400 bg-ink-50 px-2 py-1 rounded border border-ink-100 hidden sm:block">
          {today}
        </div>
        <div className="relative cursor-pointer transition-transform hover:scale-110">
          <Bell size={16} strokeWidth={2} className="text-ink-500" />
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center text-[9px] font-bold text-brand-900 transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-brand-100">
          {initiales}
        </div>
      </div>
    </div>
  );
}
