import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DataTable from '../../src/components/DataTable.jsx';
import { rightColumn, textColumn } from '../../src/lib/reportColumns.jsx';

describe('report columns', () => {
  it('renders text left and right-aligned values with their headers', () => {
    render(
      <DataTable
        columns={[
          textColumn('name', 'Name', (row) => row.name),
          rightColumn('amount', 'Amount', (row) => `₱${row.amount}`),
        ]}
        data={[{ name: 'Ana', amount: 5 }]}
        getRowId={(_, index) => String(index)}
      />,
    );
    expect(
      screen.getByRole('columnheader', { name: 'Name' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ana')).not.toHaveClass('cell-right');
    expect(screen.getByText('Amount')).toHaveClass('cell-right');
    expect(screen.getByText('₱5')).toHaveClass('cell-right', 'num-cell');
  });
});
