import { classNames } from '../../utils/helpers';

const colors = [
  'bg-primary text-white',
  'bg-emerald text-white',
  'bg-amber text-white',
  'bg-red-accent text-white',
  'bg-purple-500 text-white',
];

export default function Avatar({ name, src, size = 'md', className }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const colorIndex = name ? name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length : 0;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={classNames('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={classNames(
        'rounded-full flex items-center justify-center font-semibold select-none',
        sizes[size],
        colors[colorIndex],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
