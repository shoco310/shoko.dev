import { navLinks } from './Header'
import { operator } from '../data/site'
import { routeHref } from '../router'

const subLinks = [
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
          このサイトは{operator.name}が運営する政治活動のウェブサイトです。宇部市の公式サイト・行政サービスではありません。
        </p>
        <div className="footer__bottom">
          <p>© {operator.name}</p>
        </div>
      </div>
    </footer>
  )
}
