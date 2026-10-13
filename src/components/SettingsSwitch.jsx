export default function SettingsSwitch({ id, label, checked, disabled, onToggle }) {
  return (
    <div className="toggle-row">
      <span id={id}>{label}</span>
      <div
        className={checked ? 'switch on' : 'switch'}
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            onToggle();
          }
        }}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            onToggle();
          }
        }}
      />
    </div>
  );
}
