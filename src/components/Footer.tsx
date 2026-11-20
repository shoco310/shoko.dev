import { navLinks } from './Header'
import { operator, supportersAssociation } from '../data/site'
import { routeHref } from '../router'
import { issuesEnabled, voiceEnabled, volunteerEnabled } from '../data/features'

const subLinks = [
  ...(voiceEnabled ? [{ href: routeHref({ name: 'voice' }), label: '困りごと・ご意見を送る' }] : []),
  ...(volunteerEnabled ? [{ href: routeHref({ name: 'join' }), label: '一緒に活動する（ボランティア）' }] : []),
  ...(issuesEnabled ? [{ href: routeHref({ name: 'issues' }), label: 'みんなの声から見えた課題' }] : []),
  { href: routeHref({ name: 'data' }), label: '数字で見る宇部' },
  { href: routeHref({ name: 'activity' }), label: '活動・調査の状況' },
  { href: routeHref({ name: 'about' }), label: 'このサイトについて' },
  { href: routeHref({ name: 'privacy' }), label: 'プライバシーポリシー' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <a href="#top" className="footer__brand">さとうしょうこ</a>
          <nav className="footer__nav" aria-label="フッターナビゲーション">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <nav className="footer__sub" aria-label="サイト情報">
          {subLinks.map(link => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <p className="footer__disclaimer">
          このサイトは{operator.displayName}が運営する、個人の政治活動・政策発信のためのウェブサイトです。宇部市の公式サイト・行政サービスではありません。
        </p>
        <div className="footer__bottom">
          <p>© {supportersAssociation}</p>
        </div>
      </div>
    </footer>
  )
}
