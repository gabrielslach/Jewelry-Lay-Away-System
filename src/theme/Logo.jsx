import './assets.css';

export default function Logo({
  as: Tag = 'p',
  className = '',
  ...props
}) {
  const classes = ['logo', className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...props}>
      <img src="/store-logo.png" alt="Mine Credit" />
    </Tag>
  );
}
