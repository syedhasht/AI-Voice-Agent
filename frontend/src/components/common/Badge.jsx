import { classNames } from '../../utils/helpers';

const colorClasses = {
  emerald: 'bg-emerald/10 text-emerald-dark',
  blue: 'bg-primary/10 text-primary-dark',
  amber: 'bg-amber/10 text-amber-dark',
  red: 'bg-red-accent/10 text-red-dark',
  purple: 'bg-purple-500/10 text-purple-700',
  orange: 'bg-orange-500/10 text-orange-700',
  gray: 'bg-surface-tertiary text-text-secondary',
};

const dotColors = {
  emerald: 'bg-emerald',
  blue: 'bg-primary',
  amber: 'bg-amber',
  red: 'bg-red-accent',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-text-tertiary',
};

export default function Badge({ children, variant = 'gray', dot, className }) {
  return (
    <span className={classNames('status-badge', colorClasses[variant], className)}>
      {dot && <span className={classNames('status-dot', dotColors[variant])} />}
      {children}
    </span>
  );
}
