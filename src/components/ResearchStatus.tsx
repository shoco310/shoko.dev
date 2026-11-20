import { researchGroups, researchStatusLabel, type ResearchStatus } from '../data/research'

const statusOrder: ResearchStatus[] = ['confirmed', 'next', 'open']

/** 確認済み／次に確認すること／今後の課題 for one policy. Nothing when there is no record. */
export function ResearchStatusList({ slug }: { slug: string }) {
  const group = researchGroups.find(g => g.policySlug === slug)
  if (!group) return null
  return (
    <>
      {statusOrder.map(status => {
        const items = group.items.filter(i => i.status === status)
        if (items.length === 0) return null
        return (
          <div className="research-group__block" key={status}>
            <p className={`research-status research-status--${status}`}>{researchStatusLabel[status]}</p>
            <ul>
              {items.map(item => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  {item.detail && <span>{item.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </>
  )
}
