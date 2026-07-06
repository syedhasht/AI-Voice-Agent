import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../context';
import { Avatar } from '../common';

export default function TopNav({ onMenuClick }) {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/70 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-text-secondary hover:bg-surface-tertiary transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-sm text-text-secondary">
          <span className="text-text-primary font-medium">AI Voice Agent</span>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-tertiary">Pharmacy Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="relative p-2 rounded-xl text-text-secondary hover:bg-surface-tertiary transition-all duration-150"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="relative p-2 rounded-xl text-text-secondary hover:bg-surface-tertiary transition-all duration-150">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-accent ring-2 ring-white" />
        </button>

        <div className="ml-2 pl-2 border-l border-border">
          <Avatar name="Alex Morgan" size="sm" />
        </div>
      </div>
    </header>
  );
}
