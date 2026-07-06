import { forwardRef } from 'react';
import { classNames } from '../../utils/helpers';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20 active:shadow-none',
  secondary: 'bg-white text-text-primary border border-border hover:bg-surface-secondary active:bg-surface-tertiary shadow-sm',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-tertiary active:bg-surface-secondary',
  danger: 'bg-red-accent text-white hover:bg-red-dark shadow-sm shadow-red-accent/20 active:shadow-none',
  success: 'bg-emerald text-white hover:bg-emerald-dark shadow-sm shadow-emerald/20 active:shadow-none',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
  icon: 'p-2',
};

const Button = forwardRef(({ variant = 'primary', size = 'md', icon: Icon, children, className, loading, disabled, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={classNames(
      'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {loading && (
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {Icon && !loading && <Icon size={size === 'sm' ? 14 : 16} />}
    {children && <span>{children}</span>}
  </button>
));

Button.displayName = 'Button';
export default Button;
