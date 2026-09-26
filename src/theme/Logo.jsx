import './assets.css';

export default function Logo({
  as: Tag = 'p',
  children = 'Sample Jewelry Co.',
  className = '',
  ...props
}) {
  const classes = ['logo', className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
