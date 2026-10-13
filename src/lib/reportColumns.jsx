import { formatDisplayDate } from './dates.js';
import { formatPesoDecimals } from './money.js';
import { humanizeKey } from './reportLabels.js';

const FORMATTERS = {
  text: (value) => String(value),
  label: humanizeKey,
  date: (value) => formatDisplayDate(value) || String(value),
  money: formatPesoDecimals,
};

const firstPresent = (row, keys) =>
  keys.map((key) => row[key]).find((value) => value != null);

/**
 * Builds table columns from definitions of `{ id, header, keys, kind }`.
 * The API does not document every row field yet, so a column appears only
 * when at least one row has a value for one of its keys.
 */
export function definedColumns(definitions, rows) {
  return definitions
    .filter(({ keys }) => rows.some((row) => firstPresent(row, keys) != null))
    .map(({ id, header, keys, kind = 'text' }) => {
      const format = (row) => {
        const value = firstPresent(row, keys);
        return value == null ? '-' : FORMATTERS[kind](value);
      };
      return {
        id,
        header:
          kind === 'money'
            ? () => <span className="cell-right">{header}</span>
            : header,
        enableSorting: false,
        accessorFn: format,
        cell: ({ row }) =>
          kind === 'money' ? (
            <span className="cell-right num-cell">{format(row.original)}</span>
          ) : (
            format(row.original)
          ),
      };
    });
}
