import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, LayoutDashboard, ClipboardList, PlusCircle, Settings, X } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const iconMap = {
  Headphones, LayoutDashboard, ClipboardList, PlusCircle, Settings,
};

const items = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Orders', path: '/orders', icon: 'ClipboardList' },
  { label: 'Create Order', path: '/create-order', icon: 'PlusCircle' },
  { label: 'Voice Demo', path: '/voice-demo', icon: 'Headphones' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <AnimatePresence>
        {(open || true) && (
          <motion.aside
            initial={false}
            animate={{ x: 0 }}
            className={classNames(
              'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar flex flex-col',
              'lg:translate-x-0',
              open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="font-semibold text-sm text-white">AI Voice Agent</span>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden text-sidebar-text hover:text-white p-1 rounded-lg hover:bg-sidebar-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                          ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                      )
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-white/5">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-xs font-bold text-white">
                  AM
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Alex Morgan</p>
                  <p className="text-xs text-sidebar-text truncate">Sales Representative</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
