import { useEffect, useId, useState } from 'react'
import { useRoute, type Route } from '../router'
import { useDisclosure } from '../lib/useDisclosure'
import {
  isCurrent,
  lineOption,
  mainNav,
  participateOptions,
  type NavItem,
  type ParticipateOption,
} from '../data/nav'
import { IconLine } from './icons'

/**
 * Site header: ホーム｜私について｜V2MOM・政策 ▾｜活動｜市民の声 and the
 * 「参加する」 button. On phones the five items move into the menu, while
 * 「参加する」 stays visible next to the menu button.
 */
export default function Header() {
  const route = useRoute()
  const [scrolled, setScrolled] = useState(false)
  const menu = useDisclosure<HTMLDivElement>()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="site-header__bar">
        <a href={mainNav[0].href} className="site-header__logo">
          さとうしょうこ
        </a>

        <nav className="site-nav" aria-label="メインナビゲーション">
          <ul className="site-nav__list">
            {mainNav.map(item =>
              item.children ? (
                <NavDropdown key={item.label} item={item} route={route} />
              ) : (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="site-nav__link"
                    aria-current={isCurrent(item, route) ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="site-header__actions">
          <ParticipateMenu />
          <div ref={menu.wrapperRef} className="site-header__menu">
            <button
              ref={menu.buttonRef}
              type="button"
              className={`site-header__hamburger${menu.open ? ' is-open' : ''}`}
              onClick={menu.toggle}
              aria-expanded={menu.open}
              aria-controls="mobile-menu"
              aria-label={menu.open ? 'メニューを閉じる' : 'メニューを開く'}
            >
              <span />
              <span />
              <span />
            </button>
            <div id="mobile-menu" className="mobile-nav" hidden={!menu.open}>
              <MobileNav route={route} onNavigate={() => menu.close()} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavDropdown({ item, route }: { item: NavItem; route: Route }) {
  const d = useDisclosure<HTMLLIElement>()
  const panelId = useId()
  const current = isCurrent(item, route)
  return (
    <li ref={d.wrapperRef} className="site-nav__dropdown">
      <button
        ref={d.buttonRef}
        type="button"
        className={`site-nav__link site-nav__toggle${current ? ' is-current' : ''}`}
        aria-expanded={d.open}
        aria-controls={panelId}
        onClick={d.toggle}
      >
        {item.label}
        <Chevron />
      </button>
      <div id={panelId} className="site-nav__panel" hidden={!d.open}>
        <ul>
          {item.children!.map(child => (
            <li key={child.href}>
              <a
                href={child.href}
                className="site-nav__panel-link"
                aria-current={child.match.includes(route.name) && !child.sub ? 'page' : undefined}
                onClick={() => d.close()}
              >
                {child.label}
              </a>
              {child.sub && (
                <ul className="site-nav__sub">
                  {child.sub.map(s => (
                    <li key={s.href}>
                      <a
                        href={s.href}
                        aria-current={route.name === 'policy' && route.slug === s.slug ? 'page' : undefined}
                        onClick={() => d.close()}
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function ParticipateMenu() {
  const d = useDisclosure<HTMLDivElement>()
  const panelId = useId()
  return (
    <div ref={d.wrapperRef} className="participate-menu">
      <button
        ref={d.buttonRef}
        type="button"
        className="btn btn--primary participate-menu__button"
        aria-expanded={d.open}
        aria-controls={panelId}
        onClick={d.toggle}
      >
        参加する
        <Chevron />
      </button>
      <div id={panelId} className="participate-menu__panel" hidden={!d.open}>
        <ParticipateList onNavigate={() => d.close()} />
      </div>
    </div>
  )
}

/** The participation choices; shared by the header button and the footer. */
export function ParticipateList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="participate-list">
      {participateOptions.map(opt => (
        <li key={opt.href}>
          <OptionLink opt={opt} onNavigate={onNavigate} />
        </li>
      ))}
      <li className="participate-list__line">
        <a href={lineOption.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
          <IconLine size={18} />
          {lineOption.label}
          <span className="visually-hidden">（外部サイト）</span>
        </a>
      </li>
    </ul>
  )
}

function OptionLink({ opt, onNavigate }: { opt: ParticipateOption; onNavigate?: () => void }) {
  return (
    <a
      href={opt.href}
      className="participate-list__option"
      onClick={onNavigate}
      {...(opt.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="participate-list__label">
        {opt.label}
        <span aria-hidden="true"> →</span>
      </span>
      <span className="participate-list__desc">{opt.description}</span>
    </a>
  )
}

function MobileNav({ route, onNavigate }: { route: Route; onNavigate: () => void }) {
  return (
    <nav aria-label="メニュー">
      <ul className="mobile-nav__list">
        {mainNav.map(item => (
          <li key={item.label}>
            {item.children ? (
              <>
                <p className="mobile-nav__group">{item.label}</p>
                <ul className="mobile-nav__children">
                  {item.children.map(child => (
                    <li key={child.href}>
                      <a
                        href={child.href}
                        className="mobile-nav__link mobile-nav__link--child"
                        aria-current={child.match.includes(route.name) && !child.sub ? 'page' : undefined}
                        onClick={onNavigate}
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <a
                href={item.href}
                className="mobile-nav__link"
                aria-current={isCurrent(item, route) ? 'page' : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Chevron() {
  return (
    <svg className="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
