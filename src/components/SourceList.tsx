import type { SourceItem } from '../data/policy'

export const sourceTypeLabel: Record<SourceItem['type'], string> = {
  primary: '一次資料',
  report: '報道',
  reference: '参考・他自治体事例',
}

/** 関連資料・出典 list, shared by the policy pages and #/research (data: policy.ts sourceList). */
export function SourceList({ sources }: { sources: SourceItem[] }) {
  return (
    <ul className="policy-detail__sources">
      {sources.map((s, i) => (
        <li key={i}>
          <span className={`source-tag source-tag--${s.type}`}>{sourceTypeLabel[s.type]}</span>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ) : (
            <span>{s.label}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
