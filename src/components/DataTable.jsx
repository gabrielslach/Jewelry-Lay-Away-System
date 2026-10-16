import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

const SORT_ICONS = { asc: '↑', desc: '↓', false: '↕' };
const ARIA_SORT = { asc: 'ascending', desc: 'descending', false: 'none' };

function HeaderCell({ header }) {
  const { column } = header;
  const label = flexRender(column.columnDef.header, header.getContext());

  if (!column.getCanSort()) {
    return <th>{label}</th>;
  }
  const sorted = column.getIsSorted();
  return (
    <th aria-sort={ARIA_SORT[sorted]}>
      <button
        type="button"
        className="th-sort"
        onClick={column.getToggleSortingHandler()}
      >
        {label}
        <span className="th-sort__icon" aria-hidden="true">
          {SORT_ICONS[sorted]}
        </span>
      </button>
      {column.getCanFilter() ? (
        <input
          className="th-filter"
          type="search"
          placeholder="Filter"
          aria-label={`Filter ${column.columnDef.header}`}
          value={column.getFilterValue() ?? ''}
          onChange={(event) => column.setFilterValue(event.target.value)}
        />
      ) : null}
    </th>
  );
}

export default function DataTable({ columns, data, getRowId, emptyMessage }) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const table = useReactTable({
    columns,
    data,
    getRowId,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const rows = table.getRowModel().rows;

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <HeaderCell key={header.id} header={header} />
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (data.length > 0 || emptyMessage) ? (
          <tr>
            <td colSpan={columns.length} className="table-empty">
              {data.length > 0 ? 'No matching rows' : emptyMessage}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
