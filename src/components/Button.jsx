import { Link } from 'react-router-dom';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size,
  className = '',
  to,
  type = 'button',
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
