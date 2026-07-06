import { forwardRef } from 'react';
import { classNames } from '../../utils/helpers';

const Input = forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-text-secondary">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
          <Icon size={16} />
        </div>
      )}
      <input
        ref={ref}
        className={classNames(
          'w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          Icon && 'pl-10',
          error && 'border-red-accent focus:ring-red-accent/20 focus:border-red-accent',
          className
        )}
        {...props}
      />
    </div>
    {error && (
      <p className="text-xs text-red-accent mt-1">{error}</p>
    )}
  </div>
));

Input.displayName = 'Input';
export default Input;
