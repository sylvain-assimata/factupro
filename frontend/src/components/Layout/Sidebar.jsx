import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, FileSignature, Receipt, Settings, UsersRound, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { path: '/clients',      label: 'Clients',         icon: Users },
  { path: '/devis',        label: 'Devis',           icon: FileSignature },
  { path: '/factures',     label: 'Factures',        icon: Receipt },
  { path: '/equipe',       label: 'Équipe',          icon: UsersRound, roles: ['proprietaire', 'comptable'] },
  { path: '/parametres',   label: 'Paramètres',      icon: Settings },
];

export default function Sidebar() {
  const { utilisateur, entreprise, handleLogout } = useAuth();
  const initiales = utilisateur ? `${utilisateur.prenom[0]}${utilisateur.nom[0]}` : 'U';

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-64 bg-gradient-to-b from-brand-900 to-[#1B1852] flex flex-col min-h-screen flex-shrink-0 relative overflow-hidden"
    >
      <div className="absolute -top-16 -left-16 w-52 h-52 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-5 border-b border-white/10 flex items-center gap-3">
        <div className="relative w-11 h-11 flex-shrink-0">
          <div className="absolute inset-0 rounded-xl bg-brand-300/20 blur-lg animate-pulseGlow" />
          <div className="relative w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Receipt size={20} strokeWidth={2} className="text-brand-600" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-white text-base font-semibold tracking-wide font-display truncate">
            {entreprise?.nom || 'FactuPro'}
          </div>
          <div className="text-brand-300 text-[10px] font-medium truncate">
            {entreprise?.plan === 'essai' ? 'Essai gratuit' : entreprise?.plan}
          </div>
        </div>
      </div>

      <nav className="relative flex-1 py-3 overflow-y-auto">
        <div className="px-4 py-2 text-brand-300/70 text-[11px] font-medium uppercase tracking-wider">
          Navigation
        </div>
        {menuItems.map((item, index) => {
          if (item.roles && !item.roles.includes(utilisateur?.role)) return null;
          return (
            <motion.div
              key={item.path}
              initial={{ x: -12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.03 * index }}
            >
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 mx-2 px-4 py-2.5 rounded-md text-sm cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-brand-100 hover:bg-white/10'
                  }`
                }
              >
                {({ isActive }) => {
                  const Icon = item.icon;
                  return (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-gradient-to-b from-gold-300 to-gold-500" />
                      )}
                      <Icon size={17} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
                      <span>{item.label}</span>
                    </>
                  );
                }}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="relative p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center text-brand-900 text-xs font-bold ring-2 ring-white/10">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-brand-100 text-sm font-medium truncate">
              {utilisateur?.prenom} {utilisateur?.nom}
            </div>
            <div className="text-brand-300 text-xs truncate capitalize">{utilisateur?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-brand-300 hover:text-white transition-transform hover:scale-110 flex-shrink-0"
            title="Déconnexion"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
