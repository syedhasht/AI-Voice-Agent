import { forwardRef } from 'react';
import { classNames } from '../../utils/helpers';

const variants = {
  primary:
    'text-white font-semibold shadow-lg active:scale-[0.98]',
  secondary:
    'bg-white text-text-primary border border-[#b2e0ea] hover:border-[#22d3ee] hover:bg-[#f0fdff] shadow-sm active:bg-[#e0f7fa]',
  ghost:
    'bg-transparent text-text-secondary hover:bg-[#e0f7fa] hover:text-text-primary active:bg-[#b2ebf2]',
  danger:
    'text-white font-semibold shadow-lg active:scale-[0.98]',
  success:
    'text-white font-semibold shadow-lg active:scale-[0.98]',
  outline:
    'bg-transparent text-[#0891b2] border border-[#22d3ee] hover:bg-[#f0fdff] hover:border-[#0891b2] active:bg-[#e0f7fa]',
};

const gradients = {
  primary: { background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 60%, #0e7490 100%)', boxShadow: '0 4px 14px rgba(8,145,178,0.35)' },
  danger:  { background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 60%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(244,63,94,0.30)' },
  success: { background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 60%, #16a34a 100%)', boxShadow: '0 4px 14px rgba(34,197,94,0.30)' },
};

const sizes = {
  sm:   'px-3 py-1.5 text-xs gap-1.5',
  md:   'px-4 py-2 text-sm gap-2',
  lg:   'px-6 py-3 text-base gap-2.5',
  icon: 'p-2',
};

const Button = forwardRef(({ variant = 'primary', size = 'md', icon: Icon, children, className, loading, disabled, style, ...props }, ref) => {
  const grad = gradients[variant];
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={grad ? { ...grad, ...style } : style}
      className={classNames(
        'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0891b2]/40',
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
  );
});

Button.displayName = 'Button';
export default Button;
