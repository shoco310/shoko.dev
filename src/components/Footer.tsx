import { navLinks } from './Header'

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
        <div className="footer__bottom">
          <p>© さとうしょうこ後援会</p>
        </div>
      </div>
    </footer>
  )
}
