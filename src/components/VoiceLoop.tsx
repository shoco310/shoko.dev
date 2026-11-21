import { routeHref } from '../router'
import { voiceEnabled } from '../data/features'

/**
 * 声が政策になるまで: gather voices → improve policy → report activity →
 * gather again. Step texts as written by the operator (2026-11-21).
 */
const steps = [
  {
    num: '01',
    title: '声を集める',
    desc: '暮らしの中で感じる困りごとや、宇部市の政策へのご意見・アイデアをお寄せください。いただいた声は公開せず、一つひとつ大切に読み、今後の政策づくりに活かします。',
    links: voiceEnabled ? [{ href: routeHref({ name: 'voice' }), label: '困りごと・ご意見を送る', primary: true }] : [],
  },
  {
    num: '02',
    title: '政策を改善する',
    desc: '宇部市の課題に向き合うため、4つの政策を掲げています。市民の皆さんの声や、公式資料・データをもとに政策調査を進め、よりよい政策へと改善していきます。',
    links: [
      { href: routeHref({ name: 'policies' }), label: '4つの政策を見る', primary: false },
      { href: routeHref({ name: 'research' }), label: '政策調査を見る', primary: false },
    ],
  },
  {
    num: '03',
    title: '活動を公開する',
    desc: '政策の見直しや調査の進捗は「政策の変更履歴」で公開します。また、日々どのような活動をしているのかも発信し、取り組みの過程を見えるようにします。',
    links: [
      { href: routeHref({ name: 'changes' }), label: '政策の変更履歴', primary: false },
      { href: routeHref({ name: 'activity' }), label: '活動を見る', primary: false },
    ],
  },
]

export default function VoiceLoop() {
  return (
    <div className="participate">
      <p className="participate__intro">
        政策は、つくって終わりではありません。
        <br />
        宇部で暮らす皆さんの声から、一緒に育てていきます。
      </p>
      <ol className="participate__steps">
        {steps.map((step, i) => (
          <li className="participate__step" key={step.num}>
            <span className="participate__num" aria-hidden="true">
              {step.num}
            </span>
            <h3 className="participate__title">{step.title}</h3>
            <p className="participate__desc">{step.desc}</p>
            <div className="participate__links">
              {step.links.map(link => (
                <a key={link.href} href={link.href} className={`btn ${link.primary ? 'btn--primary' : 'btn--secondary'}`}>
                  {link.label}
                  <span aria-hidden="true">→</span>
                </a>
              ))}
            </div>
            {i < steps.length - 1 && (
              <span className="participate__arrow" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="participate__loop">
        <span aria-hidden="true">↻ </span>
        活動の報告から、また新しい声が生まれる。この循環を続けていきます。
      </p>
    </div>
  )
}

/** Shown wherever people are invited to send a voice. */
export function EmergencyNote() {
  return (
    <p className="participate__note">
      このサイトは佐藤祥子の政治活動として運営しています。宇部市への手続きや正式な相談、命や安全に関わる緊急のご相談は、宇部市の窓口や110番・119番へご連絡ください。
    </p>
  )
}
