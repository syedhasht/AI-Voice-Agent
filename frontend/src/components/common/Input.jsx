import { forwardRef } from 'react';
import { classNames } from '../../utils/helpers';

const Input = forwardRef(({ label, error, icon: Icon, prefix, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-semibold text-[#3a5566]">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#90aab8] pointer-events-none">
          <Icon size={16} />
        </div>
      )}
      {prefix && (
        <span
          className={classNames(
            'absolute top-1/2 -translate-y-1/2 text-sm font-semibold text-[#3a5566] select-none pointer-events-none',
            Icon ? 'left-10' : 'left-3'
          )}
        >
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        className={classNames(
          'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#0c1a22] placeholder:text-[#90aab8]',
          'border-[#b2e0ea] shadow-sm transition-all duration-200',
          'hover:border-[#22d3ee]',
          'focus:outline-none focus:border-[#0891b2] focus:ring-2 focus:ring-[#0891b2]/20 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.12)]',
          Icon && 'pl-10',
          prefix && (Icon ? 'pl-[72px]' : 'pl-[52px]'),
          error && 'border-[#f43f5e] focus:ring-[#f43f5e]/20 focus:border-[#f43f5e]',
          className
        )}
        {...props}
      />
    </div>
    {error && (
      <p className="text-xs text-[#f43f5e] mt-1 font-medium">{error}</p>
    )}
  </div>
));

Input.displayName = 'Input';
export default Input;
