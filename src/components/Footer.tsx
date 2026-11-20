import { operator, supportersAssociation } from '../data/site'
import { routeHref } from '../router'
import { mainNav, participateOptions, policyMenu } from '../data/nav'
import { associationFormUrl, lineUrl, socialLinks } from '../data/social'
import { IconLine, SocialIcon } from './icons'

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

/** The main pages, without the dropdown (its pages have their own column). */
const siteLinks = mainNav.filter(item => !item.children)

/**
 * Compact dark footer: brand and SNS, three link columns, contact details
 * of the supporters' association, then the legal line. 「ページの先頭へ」
 * returns to the top of the current page.
 */
export default function Footer() {
  const toTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.querySelector<HTMLElement>('.site-header__logo')?.focus({ preventScroll: true })
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <a href={siteLinks[0].href} className="site-footer__logo">
              さとうしょうこ
            </a>
            <p className="site-footer__tagline">誰もが挑戦できる宇部へ。</p>
          </div>
          <ul className="site-footer__sns" aria-label="SNS・LINE">
            <li>
              <a href={lineUrl} {...ext} aria-label="LINE公式アカウント" title="LINE">
                <IconLine size={16} />
              </a>
            </li>
            {socialLinks.map(s => (
              <li key={s.key}>
                <a href={s.href} {...ext} aria-label={s.label} title={s.label}>
                  <SocialIcon name={s.key} size={16} />
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="site-footer__totop" onClick={toTop}>
            ページの先頭へ
            <span aria-hidden="true">↑</span>
          </button>
        </div>

        <div className="site-footer__grid">
          <nav aria-labelledby="footer-site">
            <h2 id="footer-site" className="site-footer__heading">サイト</h2>
            <ul>
              {siteLinks.map(l => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-policy">
            <h2 id="footer-policy" className="site-footer__heading">V2MOM・政策</h2>
            <ul>
              {policyMenu.map(link => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-join">
            <h2 id="footer-join" className="site-footer__heading">参加する</h2>
            <ul>
              {participateOptions
                .filter(o => !o.external)
                .map(o => (
                  <li key={o.href}>
                    <a href={o.href}>{o.label}</a>
                  </li>
                ))}
              <li>
                <a href={associationFormUrl} {...ext}>
                  後援会に入会する（入会フォーム）
                </a>
              </li>
              <li>
                <a href={lineUrl} {...ext}>
                  LINE公式アカウント
                </a>
              </li>
            </ul>
          </nav>

          <section id="contact" aria-labelledby="footer-contact" className="site-footer__contact">
            <h2 id="footer-contact" className="site-footer__heading">お問い合わせ</h2>
            <dl>
              <dt>団体名</dt>
              <dd>{supportersAssociation}</dd>
              <dt>所在地</dt>
              <dd>{operator.address}</dd>
              <dt>メール</dt>
              <dd>{operator.emailDisplay}</dd>
            </dl>
          </section>
        </div>

        <div className="site-footer__bottom">
          <ul className="site-footer__legal">
            <li>
              <a href={routeHref({ name: 'about' })}>このサイトについて</a>
            </li>
            <li>
              <a href={routeHref({ name: 'privacy' })}>プライバシーポリシー</a>
            </li>
          </ul>
          <p className="site-footer__copy">© {supportersAssociation}</p>
          <p className="site-footer__disclaimer">
            このサイトは{operator.displayName}が運営する、個人の政治活動・政策発信のためのウェブサイトです。宇部市の公式サイト・行政サービスではありません。
          </p>
        </div>
      </div>
    </footer>
  )
}
