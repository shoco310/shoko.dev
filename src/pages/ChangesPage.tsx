import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import ChangeEntry from '../components/ChangeEntry'
import { policies } from '../data/policy'
import { listPublishedChanges } from '../lib/publicContent'
import { useAsync } from '../lib/useAsync'

function scopeLabel(slugs: string[]) {
  if (slugs.length === policies.length) return '4つの政策すべて'
  return slugs.map(s => policies.find(p => p.slug === s)?.name ?? s).join('、')
}

/** Every published policy change, newest first. Past records are never deleted. */
export default function ChangesPage() {
  const [policy, setPolicy] = useState('')
  const { data, error, loading } = useAsync(listPublishedChanges, [])
  const shown = (data ?? []).filter(e => !policy || e.slugs.includes(policy))

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
      <div aria-live="polite">
        {loading && <p className="page__muted">読み込んでいます…</p>}
        {error && <p className="page__muted">変更履歴を読み込めませんでした。時間をおいて、もう一度お試しください。</p>}
        {data && <p className="page__muted">{shown.length}件</p>}
      </div>
      <ol className="changes">
        {shown.map(e => (
          <ChangeEntry key={e.change.id} change={e.change} scope={scopeLabel(e.slugs)} headingLevel={3} />
        ))}
      </ol>
      <div className="policy-detail__note page__notice">
        <p>
          公開した記録は、あとから書き換えたり削除したりできない仕組みにしています。誤りがあった場合は、訂正の記録を新しく追加します。変更の詳しい内容は、各記録の「記録」から GitHub の履歴でも確認できます。
        </p>
      </div>
    </PageLayout>
  )
}
