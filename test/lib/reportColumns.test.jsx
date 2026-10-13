import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DataTable from '../../src/components/DataTable.jsx';
import { definedColumns } from '../../src/lib/reportColumns.jsx';

const DEFINITIONS = [
  { id: 'name', header: 'Name', keys: ['name', 'full_name'] },
  { id: 'due', header: 'Due', keys: ['due'], kind: 'date' },
  { id: 'amount', header: 'Amount', keys: ['amount'], kind: 'money' },
  { id: 'type', header: 'Type', keys: ['type'], kind: 'label' },
  { id: 'missing', header: 'Never', keys: ['nope'] },
];

describe('definedColumns', () => {
  it('shows only columns that some row has, with "-" for gaps and formatted values', () => {
    const rows = [
      { name: 'Ana', due: '2026-10-01', amount: 12.5, type: 'late_fee' },
      { full_name: 'Ben' },
    ];
    const columns = definedColumns(DEFINITIONS, rows);
    expect(columns.map((column) => column.id)).toEqual([
      'name',
      'due',
      'amount',
      'type',
    ]);
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(_, index) => String(index)}
      />,
    );
    expect(
      screen.queryByRole('columnheader', { name: 'Never' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Ben')).toBeInTheDocument();
    expect(screen.getByText('Oct 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('₱12.50')).toBeInTheDocument();
    expect(screen.getByText('Late fee')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(3);
  });
});
