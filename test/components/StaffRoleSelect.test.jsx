import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StaffRoleSelect from '../../src/components/StaffRoleSelect.jsx';

describe('StaffRoleSelect', () => {
  it('disables a full role and shows the cap hint', () => {
    render(
      <StaffRoleSelect
        value="accounting"
        full={['admin']}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole('option', { name: 'Admin (limit reached)' }),
    ).toBeDisabled();
    expect(
      screen.getByText(/limited to 2 and accounting to 3/),
    ).toBeInTheDocument();
  });

  it('keeps the current role selectable even when full', () => {
    render(
      <StaffRoleSelect
        value="admin"
        full={['admin']}
        keepRole="admin"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('option', { name: 'Admin' })).toBeEnabled();
    expect(screen.queryByText(/limited to 2/)).not.toBeInTheDocument();
  });

  it('reports changes and prefers the locked hint', () => {
    const onChange = vi.fn();
    render(
      <StaffRoleSelect
        value="admin"
        full={[]}
        lockedHint="Locked."
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'accounting' },
    });
    expect(onChange).toHaveBeenCalledWith('accounting');
    expect(screen.getByText('Locked.')).toBeInTheDocument();
  });
});
