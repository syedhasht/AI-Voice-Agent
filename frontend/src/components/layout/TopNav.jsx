import { Menu } from 'lucide-react';

export default function TopNav({ onMenuClick }) {
  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6"
      style={{
        background: 'rgba(240, 253, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(8, 145, 178, 0.14)',
        boxShadow: '0 2px 16px rgba(8, 145, 178, 0.07)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-[#3a5566] hover:bg-[#e0f7fa] hover:text-[#0891b2] transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="font-semibold text-[#0c1a22]">MediVoice AI</span>
          <span className="text-[#90aab8]">/</span>
          <span className="text-[#3a5566]">Pharmacy Dashboard</span>
        </div>
      </div>
    </header>
  );
}
