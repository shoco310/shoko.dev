import { useMemo, useState } from 'react'
import PageLayout from '../components/PageLayout'
import ChangeEntry from '../components/ChangeEntry'
import { policies, type PolicyChange } from '../data/policy'

/**
 * Every policy change in one place, newest first. A change shared by all
 * four policies (same id) is shown once with "4つの政策すべて".
 */
export function allPolicyChanges(): { change: PolicyChange; slugs: string[] }[] {
  const byId = new Map<string, { change: PolicyChange; slugs: string[] }>()
  for (const p of policies) {
    for (const c of p.changelog ?? []) {
      const entry = byId.get(c.id) ?? { change: c, slugs: [] }
      entry.slugs.push(p.slug)
      byId.set(c.id, entry)
    }
  }
  return [...byId.values()].sort((a, b) => b.change.date.localeCompare(a.change.date) || a.change.id.localeCompare(b.change.id))
}

function scopeLabel(slugs: string[]) {
  if (slugs.length === policies.length) return '4つの政策すべて'
  return slugs.map(s => policies.find(p => p.slug === s)?.name ?? s).join('、')
}

export default function ChangesPage() {
  const [policy, setPolicy] = useState('')
  const all = useMemo(allPolicyChanges, [])
  const shown = all.filter(e => !policy || e.slugs.includes(policy))

  return (
    <PageLayout
      en="CHANGES"
      title="政策の変更履歴"
      lead="政策をいつ、なぜ、何をもとに変えたのかを公開しています。過去の記録は消さずに残します。"
    >
      <div className="issues-filters" role="group" aria-label="変更履歴の絞り込み">
        <label>
          <span>政策</span>
          <select value={policy} onChange={e => setPolicy(e.target.value)}>
            <option value="">すべて</option>
            {policies.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="page__muted" aria-live="polite">
        {shown.length}件
      </p>
      <ol className="changes">
        {shown.map(e => (
          <ChangeEntry key={e.change.id} change={e.change} scope={scopeLabel(e.slugs)} headingLevel={3} />
        ))}
      </ol>
      <div className="policy-detail__note page__notice">
        <p>
          変更の詳しい記録は、すべて GitHub の履歴に残しています。各変更の「記録」から、実際に書き換えた内容を確認できます。
        </p>
      </div>
    </PageLayout>
  )
}
