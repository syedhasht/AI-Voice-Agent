import { Menu } from 'lucide-react';

export default function TopNav({ onMenuClick }) {
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
    </header>
  );
}
