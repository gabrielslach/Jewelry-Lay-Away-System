export function textColumn(id, header, value) {
  return { id, header, enableSorting: false, accessorFn: value };
}

/** Right-aligned column for money and counts; `value` returns display text. */
export function rightColumn(id, header, value) {
  return {
    id,
    header: () => <span className="cell-right">{header}</span>,
    enableSorting: false,
    accessorFn: value,
    cell: ({ getValue }) => (
      <span className="cell-right num-cell">{getValue()}</span>
    ),
  };
}
