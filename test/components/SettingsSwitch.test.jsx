import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsSwitch from '../../src/components/SettingsSwitch.jsx';

describe('SettingsSwitch', () => {
  it('toggles on click and keyboard', () => {
    const onToggle = vi.fn();
    render(<SettingsSwitch id="s" label="Active" checked onToggle={onToggle} />);
    const toggle = screen.getByRole('switch', { name: 'Active' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('does nothing when disabled', () => {
    const onToggle = vi.fn();
    render(<SettingsSwitch id="s" label="Active" checked={false} disabled onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Active' }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
