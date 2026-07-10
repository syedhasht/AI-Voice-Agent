import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common';
import * as Icons from 'lucide-react';
import { classNames } from '../../utils/helpers';

const iconMap = {
  ClipboardList: Icons.ClipboardList,
  Clock: Icons.Clock,
  CheckCircle: Icons.CheckCircle,
  RefreshCw: Icons.RefreshCw,
  XCircle: Icons.XCircle,
  Headphones: Icons.Headphones,
};

const iconStyle = {
  primary: { background: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)', color: '#0e7490', border: '1px solid #67e8f9' },
  amber:   { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', border: '1px solid #fcd34d' },
  emerald: { background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d', border: '1px solid #86efac' },
  red:     { background: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', color: '#be123c', border: '1px solid #fda4af' },
};

const hoverGradient = {
  primary: 'rgba(6,182,212,0.08)',
  amber:   'rgba(245,158,11,0.07)',
  emerald: 'rgba(34,197,94,0.07)',
  red:     'rgba(244,63,94,0.07)',
};

export default function KPICard({ label, value, change, changeType, icon, color = 'primary', index }) {
  const Icon = iconMap[icon] || Icons.Box;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card hover className="relative overflow-hidden group cursor-pointer">
        {/* hover tint layer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
          style={{ background: hoverGradient[color] }}
        />
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={iconStyle[color]}
            >
              <Icon size={18} />
            </div>
            {change && (
              <div
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border"
                style={
                  changeType === 'positive'
                    ? { background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                    : { background: '#ffe4e6', color: '#be123c', borderColor: '#fda4af' }
                }
              >
                {changeType === 'positive' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {change}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-[#0c1a22] tracking-tight">{value}</p>
          <p className="text-xs font-semibold text-[#3a5566] mt-1 uppercase tracking-wider">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}
