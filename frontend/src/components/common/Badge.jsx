import { classNames } from '../../utils/helpers';

const colorClasses = {
  emerald: 'bg-[#dcfce7] text-[#15803d] border border-[#86efac]',
  blue:    'bg-[#cffafe] text-[#0e7490] border border-[#67e8f9]',
  amber:   'bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]',
  red:     'bg-[#ffe4e6] text-[#be123c] border border-[#fda4af]',
  purple:  'bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]',
  orange:  'bg-[#ffedd5] text-[#c2410c] border border-[#fdba74]',
  gray:    'bg-[#f0fafb] text-[#3a5566] border border-[#b2e0ea]',
};

const dotColors = {
  emerald: 'bg-[#22c55e]',
  blue:    'bg-[#0891b2]',
  amber:   'bg-[#f59e0b]',
  red:     'bg-[#f43f5e]',
  purple:  'bg-[#a855f7]',
  orange:  'bg-[#f97316]',
  gray:    'bg-[#90aab8]',
};

export default function Badge({ children, variant = 'gray', dot, className }) {
  return (
    <span className={classNames('status-badge', colorClasses[variant], className)}>
      {dot && <span className={classNames('status-dot', dotColors[variant])} />}
      {children}
    </span>
  );
}
