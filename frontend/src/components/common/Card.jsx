import { classNames } from '../../utils/helpers';

export default function Card({ children, className, hover, padding = true, ...props }) {
  return (
    <div
      className={classNames(
        'card',
        hover && 'card-hover',
        padding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
