import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DataTable from '../../src/components/DataTable.jsx';

const columns = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (item) => item.name,
    cell: ({ row }) => row.original.name,
  },
  {
    id: 'tag',
    header: 'Tag',
    accessorFn: (item) => item.tag,
    cell: ({ row }) => <b>{row.original.tag}</b>,
  },
  {
    id: 'actions',
    header: 'View',
    enableSorting: false,
    enableColumnFilter: false,
    cell: () => <button type="button">Open</button>,
  },
];
const data = [
  { id: 'a', name: 'Ring', tag: 'new' },
  { id: 'b', name: 'Chain', tag: 'sale' },
  { id: 'c', name: 'Anklet', tag: 'new' },
];

function renderTable(rows = data) {
  render(<DataTable columns={columns} data={rows} getRowId={(r) => r.id} />);
}

function names() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);
}

function typeInto(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('DataTable', () => {
  it('renders headers and one row per item with custom cells', () => {
    renderTable();
    expect(screen.getByRole('columnheader', { name: /^Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Tag/ })).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(within(rows[2]).getByText('Chain')).toBeInTheDocument();
    expect(within(rows[2]).getByText('sale').tagName).toBe('B');
  });

  it('renders only headers when there is no data', () => {
    renderTable([]);
    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.queryByText('No matching rows')).not.toBeInTheDocument();
  });

  it('cycles sort ascending, descending, then back to none', () => {
    renderTable();
    const header = screen.getByRole('columnheader', { name: /^Name/ });
    const button = within(header).getByRole('button');

    expect(header).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(button);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(names()).toEqual(['Anklet', 'Chain', 'Ring']);
    fireEvent.click(button);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(names()).toEqual(['Ring', 'Chain', 'Anklet']);
    fireEvent.click(button);
    expect(header).toHaveAttribute('aria-sort', 'none');
    expect(names()).toEqual(['Ring', 'Chain', 'Anklet']);
  });

  it('filters case-insensitively and combines column filters', () => {
    renderTable();
    typeInto('Filter Tag', 'NEW');
    expect(names()).toEqual(['Ring', 'Anklet']);
    typeInto('Filter Name', 'ank');
    expect(names()).toEqual(['Anklet']);
  });

  it('shows a no-match row when filters exclude everything', () => {
    renderTable();
    typeInto('Filter Name', 'zzz');
    expect(screen.getByText('No matching rows')).toBeInTheDocument();
  });

  it('gives action columns a plain header without controls', () => {
    renderTable();
    const header = screen.getByRole('columnheader', { name: 'View' });
    expect(within(header).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filter View')).not.toBeInTheDocument();
    expect(header).not.toHaveAttribute('aria-sort');
  });

  it('labels cells with their column header for stacked layouts', () => {
    render(<DataTable columns={columns} data={data} getRowId={(row) => row.id} />);
    expect(screen.getByText('Ring').closest('td')).toHaveAttribute('data-label', 'Name');
  });
});
