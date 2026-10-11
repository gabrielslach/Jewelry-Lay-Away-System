import { parseIsoDate } from '../lib/dates.js';
import { formatPesoCompact, formatPesoDecimals } from '../lib/money.js';

export default function CollectionsBar({ week, weekNumber }) {
  const weekOf = parseIsoDate(week.week_start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const description = `Week of ${weekOf}: ${formatPesoDecimals(week.total)}`;
  const isZero = week.total <= 0;

  return (
    <div className="bar-col" role="listitem" aria-label={description}>
      <span className={isZero ? 'bar-label bar-label-zero' : 'bar-label bar-total'} aria-hidden="true">
        {formatPesoCompact(week.total)}
      </span>
      <div className="bar-track">
        <div
          className={isZero ? 'bar bar-zero' : 'bar'}
          title={description}
          style={isZero ? undefined : { height: `${week.height}%` }}
        />
      </div>
      <span className="bar-label bar-week" aria-hidden="true">
        Wk {weekNumber}
      </span>
    </div>
  );
}
