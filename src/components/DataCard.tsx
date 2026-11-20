import type { CSSProperties } from 'react'
import type { DataPoint } from '../data/policy'

/**
 * One confirmed statistic card (DATA section). Shared by the policy detail
 * pages and the /data overview so both render sources identically.
 */
export default function DataCard({ d }: { d: DataPoint }) {
  const isMultiStat = !!d.stats && d.stats.length > 1
  const isSingleStat = !d.highlight && !isMultiStat && (!!d.value || (!!d.stats && d.stats.length === 1))
  const singleStat = d.stats && d.stats.length === 1 ? d.stats[0] : undefined
  return (
    <div className={`data-card ${isSingleStat ? '' : 'data-card--stacked'}`}>
      {isSingleStat && (
        <div className="data-card__figure">
          {singleStat ? (
            <>
              <p className="data-card__value">{singleStat.value}</p>
              {typeof singleStat.barPct === 'number' && (
                <div className="data-card__bar">
                  <div className="data-card__bar-fill" style={{ width: `${singleStat.barPct}%` }} />
                </div>
              )}
            </>
          ) : (
            d.value && <p className="data-card__value">{d.value}</p>
          )}
        </div>
      )}

      <div className="data-card__body">
        <div className="data-card__head">
          <p className="data-card__label">{d.label}</p>
          <p className="data-card__meta">{d.survey}</p>
        </div>

        {d.highlight && <p className="data-card__highlight">{d.value}</p>}

        {isMultiStat && (
          <div
            className="data-card__stats"
            style={{ '--stat-cols': Math.min(d.stats!.length, 3) } as CSSProperties}
          >
            {d.stats!.map((s, j) => (
              <div className="data-card__stat" key={j}>
                <p className="data-card__stat-label">{s.label}</p>
                <p className="data-card__stat-value">{s.value}</p>
                {typeof s.barPct === 'number' && (
                  <div className="data-card__bar">
                    <div className="data-card__bar-fill" style={{ width: `${s.barPct}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {d.description && <p className="data-card__description">{d.description}</p>}

        {d.breakdown && (
          <ul className={`data-card__breakdown ${d.chartable ? 'data-card__breakdown--chart' : ''}`}>
            {d.breakdown.map((b, j) => (
              <li key={j}>
                <div className="data-card__breakdown-row">
                  <span>{b.label}</span>
                  <strong>{b.value}</strong>
                </div>
                {d.chartable && typeof b.barPct === 'number' && (
                  <div className="data-card__bar">
                    <div className="data-card__bar-fill" style={{ width: `${b.barPct}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {d.note && <p className="data-card__note">{d.note}</p>}
      </div>

      <div className="data-card__source">
        <span>{d.source}</span>
        {d.sourceUrl && (
          <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
            原本を見る →
          </a>
        )}
      </div>
    </div>
  )
}
