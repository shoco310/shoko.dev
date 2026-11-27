import { useEffect, useRef } from 'react'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import PolicyDetail from './pages/PolicyDetail'
import ProfilePage from './pages/ProfilePage'
import VisionPage from './pages/VisionPage'
import PoliciesPage from './pages/PoliciesPage'
import ResearchPage from './pages/ResearchPage'
import DataPage from './pages/DataPage'
import ActivityPage from './pages/ActivityPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFoundPage from './pages/NotFoundPage'
import VoicePage from './pages/VoicePage'
import JoinPage from './pages/JoinPage'
import IssuesPage from './pages/IssuesPage'
import IssueDetailPage from './pages/IssueDetailPage'
import ChangesPage from './pages/ChangesPage'
import ReportPage from './pages/ReportPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import TakePartSection from './components/TakePartSection'
import { ActivityTeaser, PolicyTeaser, VisionTeaser } from './components/HomeSections'
import { issuesEnabled, voiceEnabled, volunteerEnabled } from './data/features'
import { getPolicyBySlug, type Policy } from './data/policy'
import { legacyAnchorTarget, navigate, routeHref, routeKey, useRoute, type Route } from './router'

const SITE_TITLE = 'さとうしょうこ | 誰もが挑戦できる宇部へ'

const pageTitles: Partial<Record<Route['name'], string>> = {
  profile: '私について',
  vision: 'V2MOM（目指す未来）',
  policies: '4つの重点政策',
  research: '政策調査',
  data: '数字で見る宇部',
  activity: 'これまでの活動',
  about: 'このサイトについて',
  privacy: 'プライバシーポリシー',
  voice: '困りごと・ご意見を送る',
  join: '一緒に活動する',
  issues: '市民の声',
  changes: '政策の変更履歴',
  events: 'イベント・活動予定',
  event: 'イベント',
  report: '活動報告',
  issue: '課題',
  notFound: 'ページが見つかりません',
}

function titleFor(route: Route, policy: Policy | undefined): string {
  if (route.name === 'home') return SITE_TITLE
  if (route.name === 'voice' && !voiceEnabled) return `${pageTitles.notFound} | さとうしょうこ`
  if (route.name === 'join' && !volunteerEnabled) return `${pageTitles.notFound} | さとうしょうこ`
  if ((route.name === 'issues' || route.name === 'issue') && !issuesEnabled) return `${pageTitles.notFound} | さとうしょうこ`
  if (route.name === 'policy') {
    return policy ? `${policy.name} | さとうしょうこ` : `${pageTitles.notFound} | さとうしょうこ`
  }
  return `${pageTitles[route.name]} | さとうしょうこ`
}

export default function App() {
  const route = useRoute()
  const policy = route.name === 'policy' ? getPolicyBySlug(route.slug) : undefined
  const key = routeKey(route)
  const mainRef = useRef<HTMLElement>(null)
  // Previous page key; compared instead of a 'first render' flag so the
  // effect is idempotent (React StrictMode runs effects twice in dev).
  const prevKey = useRef<string | null>(null)

  useEffect(() => {
    document.title = titleFor(route, policy)
  }, [key, policy])

  // On page change: jump to the requested in-page anchor (e.g. "#policy"
  // from a subpage's nav) once the top page has rendered, otherwise start
  // at the top. Move focus to <main> so screen readers announce the new
  // page. Hash changes within the top page are left to the browser.
  useEffect(() => {
    const first = prevKey.current === null
    const same = prevKey.current === key
    prevKey.current = key
    if (same) return

    if (route.name === 'home' && route.anchor) {
      // Anchors from before the renewal (#message, #support…) now point
      // to a page or a different section.
      const legacy = legacyAnchorTarget(route.anchor, { volunteerEnabled })
      if (legacy && 'route' in legacy) {
        navigate(routeHref(legacy.route), { replace: true })
        return
      }
      const id = legacy?.anchor ?? route.anchor
      const go = () => document.getElementById(id)?.scrollIntoView()
      requestAnimationFrame(go)
      // Fonts, events and reports load afterwards and move sections down;
      // land on the target again until the reader touches, scrolls or types.
      let touched = false
      const stop = () => (touched = true)
      const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
      inputs.forEach(t => window.addEventListener(t, stop, { once: true, passive: true }))
      const again = () => {
        if (!touched) go()
      }
      document.fonts?.ready.then(again)
      // Re-land whenever the page height changes (data can take a few
      // seconds), for up to 5 s. No cleanup: StrictMode re-runs this
      // effect and would cancel it.
      const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(again)
      ro?.observe(document.body)
      window.setTimeout(() => {
        ro?.disconnect()
        inputs.forEach(t => window.removeEventListener(t, stop))
      }, 5000)
      return
    }
    // '/vision#methods': the section, once the page has rendered.
    const hashId = window.location.hash.length > 1 ? decodeURIComponent(window.location.hash.slice(1)) : null
    if (hashId) {
      requestAnimationFrame(() => document.getElementById(hashId)?.scrollIntoView())
      if (!first) mainRef.current?.focus({ preventScroll: true })
      return
    }
    if (first) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [key])

  return (
    <MotionConfig reducedMotion="user">
      {/* Move focus to <main> rather than adding '#main-content' to the URL. */}
      <a
        className="skip-link"
        href="#main-content"
        onClick={e => {
          e.preventDefault()
          mainRef.current?.focus()
          mainRef.current?.scrollIntoView()
        }}
      >
        本文へ移動
      </a>
      <Header />
      <main ref={mainRef} id="main-content" tabIndex={-1} className="site-main">
        {renderPage(route, policy)}
      </main>
      <Footer />
      <BackToTop />
    </MotionConfig>
  )
}

function renderPage(route: Route, policy: Policy | undefined) {
  switch (route.name) {
    case 'home':
      return (
        <>
          <Hero />
          <VisionTeaser />
          <PolicyTeaser />
          <ActivityTeaser />
          {(voiceEnabled || volunteerEnabled) && <TakePartSection />}
        </>
      )
    case 'profile':
      return <ProfilePage />
    case 'vision':
      return <VisionPage />
    case 'policies':
      return <PoliciesPage />
    case 'research':
      return <ResearchPage />
    case 'policy':
      return policy ? <PolicyDetail policy={policy} /> : <NotFoundPage />
    case 'data':
      return <DataPage />
    case 'activity':
      return <ActivityPage />
    case 'about':
      return <AboutPage />
    case 'privacy':
      return <PrivacyPage />
    case 'voice':
      return voiceEnabled ? <VoicePage /> : <NotFoundPage />
    case 'join':
      return volunteerEnabled ? <JoinPage /> : <NotFoundPage />
    case 'issues':
      return issuesEnabled ? <IssuesPage /> : <NotFoundPage />
    case 'changes':
      return <ChangesPage />
    case 'events':
      return <EventsPage />
    case 'event':
      return <EventDetailPage slug={route.slug} />
    case 'report':
      return <ReportPage slug={route.slug} />
    case 'issue':
      return issuesEnabled ? <IssueDetailPage id={route.id} /> : <NotFoundPage />
    case 'notFound':
      return <NotFoundPage />
  }
}
