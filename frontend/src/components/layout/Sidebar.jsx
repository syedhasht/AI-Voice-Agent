import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, LayoutDashboard, ClipboardList, PlusCircle,
  Settings, X, Users, Phone, BarChart3, Bot, BookOpen
} from 'lucide-react';
import { classNames } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  Headphones, LayoutDashboard, ClipboardList, PlusCircle,
  Settings, Users, Phone, BarChart3, Bot, BookOpen
};

const items = [
  { label: 'Dashboard',    path: '/dashboard',    icon: 'LayoutDashboard' },
  { label: 'Escalated Calls', path: '/need-human', icon: 'Headphones' },
  { label: 'Orders',       path: '/orders',       icon: 'ClipboardList' },
  { label: 'Create Order', path: '/create-order', icon: 'PlusCircle' },
  { label: 'Customers',    path: '/customers',    icon: 'Users' },
  { label: 'Calls',        path: '/calls',        icon: 'Phone' },
  { label: 'Analytics',    path: '/analytics',    icon: 'BarChart3' },
//  { label: 'AI Assistant', path: '/ai-assistant', icon: 'Bot' },
//  { label: 'RAG Assistant',path: '/rag-assistant',icon: 'BookOpen' },
  { label: 'Settings',     path: '/settings',     icon: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <AnimatePresence>
        {(open || true) && (
          <motion.aside
            initial={false}
            animate={{ x: 0 }}
            className={classNames(
              'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col',
              'lg:translate-x-0',
              open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
            style={{
              background: 'linear-gradient(180deg, #071428 0%, #091c38 60%, #071428 100%)',
              boxShadow: '4px 0 30px rgba(0,0,0,0.35)',
            }}
          >
            {/* Logo */}
            <div
              className="flex items-center justify-between px-5 h-16 shrink-0"
              style={{ borderBottom: '1px solid rgba(6,182,212,0.12)' }}
            >
              <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 60%, #0e7490 100%)',
                    boxShadow: '0 4px 14px rgba(8,145,178,0.5)',
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-white tracking-wide">MediVoice AI</span>
              </NavLink>
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg transition-colors text-[#7aa5c0] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      classNames(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'text-white'
                          : 'text-[#7aa5c0] hover:text-white hover:bg-white/5'
                      )
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            background: 'linear-gradient(90deg, rgba(8,145,178,0.90) 0%, rgba(6,182,212,0.70) 100%)',
                            boxShadow: '0 2px 12px rgba(8,145,178,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
                          }
                        : {}
                    }
                  >
                    <Icon size={17} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* User */}
            <div
              className="px-3 py-4"
              style={{ borderTop: '1px solid rgba(6,182,212,0.12)' }}
            >
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(6,182,212,0.08)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                  style={{
                    background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
                    boxShadow: '0 2px 8px rgba(8,145,178,0.4)',
                  }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-[#7aa5c0] truncate">{user.role}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
