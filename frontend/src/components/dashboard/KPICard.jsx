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

const bgGradient = {
  primary: 'from-primary/10 to-primary/5',
  amber: 'from-amber/10 to-amber/5',
  emerald: 'from-emerald/10 to-emerald/5',
  red: 'from-red-accent/10 to-red-accent/5',
};

const iconBg = {
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber/10 text-amber-dark',
  emerald: 'bg-emerald/10 text-emerald-dark',
  red: 'bg-red-accent/10 text-red-dark',
};

export default function KPICard({ label, value, change, changeType, icon, color = 'primary', index }) {
  const Icon = iconMap[icon] || Icons.Box;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card hover className="relative overflow-hidden group">
        <div className={classNames('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', bgGradient[color])} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center', iconBg[color])}>
              <Icon size={18} />
            </div>
            <div className={classNames(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              changeType === 'positive' ? 'bg-emerald/10 text-emerald-dark' : 'bg-red-accent/10 text-red-dark'
            )}>
              {changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change}
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-sm text-text-secondary mt-1">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}
