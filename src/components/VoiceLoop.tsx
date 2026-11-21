import { routeHref } from '../router'
import { voiceEnabled } from '../data/features'

/**
 * 声が政策になるまで: gather voices → improve policy → report activity →
 * gather again. Moved from the top page's 「声を届ける」 section (wording
 * unchanged; links now point to the new pages).
 */
const steps = [
  {
    num: '01',
    title: '声を集める',
    desc: '暮らしの中の困りごとや、政策へのご意見をフォームから送れます。内容は公開されず、佐藤祥子が一つひとつ読みます。',
    links: voiceEnabled ? [{ href: routeHref({ name: 'voice' }), label: '困りごと・ご意見を送る', primary: true }] : [],
  },
  {
    num: '02',
    title: '政策を改善する',
    desc: 'いただいた声と、宇部市の公式な資料やデータを照らし合わせて政策を見直します。見直した内容は「政策の変更履歴」で公開します。',
    links: [
      { href: routeHref({ name: 'policies' }), label: '4つの政策を見る', primary: false },
      { href: routeHref({ name: 'changes' }), label: '政策の変更履歴', primary: false },
    ],
  },
  {
    num: '03',
    title: '活動を公開する',
    desc: '調査がどこまで進んだか、どんな活動をしたかを報告します。そしてまた、新しい声を集めます。',
    links: [
      { href: routeHref({ name: 'research' }), label: '政策調査を見る', primary: false },
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
