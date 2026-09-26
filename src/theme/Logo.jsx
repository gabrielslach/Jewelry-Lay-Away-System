import './assets.css';

export default function Logo({
  as: Tag = 'p',
  className = '',
  withName = false,
  ...props
}) {
  const classes = ['logo', withName && 'logo--named', className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} {...props}>
      <img src="/store-logo.png" alt={withName ? '' : 'Mine Credit'} />
      {withName ? <span className="logo-name">Mine Credit</span> : null}
    </Tag>
  );
}
