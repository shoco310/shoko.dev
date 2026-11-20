import { useEffect, useRef } from 'react'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import Greeting from './components/Greeting'
import ActivitySection from './components/ActivitySection'
import PolicySection from './components/PolicySection'
import ParticipateSection from './components/ParticipateSection'
import ProfileSection from './components/ProfileSection'
import Footer from './components/Footer'
import PolicyDetail from './pages/PolicyDetail'
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
import EventsPage from './pages/EventsPage'
import ReportPage from './pages/ReportPage'
import UpcomingEventsSection from './components/UpcomingEventsSection'
import TakePartSection from './components/TakePartSection'
import { issuesEnabled, voiceEnabled, volunteerEnabled } from './data/features'
import { getPolicyBySlug, type Policy } from './data/policy'
import { routeKey, useRoute, type Route } from './router'

const SITE_TITLE = 'さとうしょうこ | 誰もが挑戦できる宇部へ'

const pageTitles: Partial<Record<Route['name'], string>> = {
  data: '数字で見る宇部',
  activity: '活動・調査の状況',
  about: 'このサイトについて',
  privacy: 'プライバシーポリシー',
  voice: '困りごと・ご意見を送る',
  join: '一緒に活動する',
  issues: 'みんなの声から見えた課題',
  changes: '政策の変更履歴',
  events: '活動予定',
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
      const id = route.anchor
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
      return
    }
    if (first) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [key])

  return (
    <MotionConfig reducedMotion="user">
      {/* Hash routing: move focus instead of following '#…', which would change the route. */}
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
    </MotionConfig>
  )
}

function renderPage(route: Route, policy: Policy | undefined) {
  switch (route.name) {
    case 'home':
      return (
        <>
          <Hero />
          <Greeting />
          <PolicySection />
          {voiceEnabled && <ParticipateSection />}
          <UpcomingEventsSection />
          <ActivitySection />
          <ProfileSection />
          {(voiceEnabled || volunteerEnabled) && <TakePartSection />}
        </>
      )
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
    case 'report':
      return <ReportPage slug={route.slug} />
    case 'issue':
      return issuesEnabled ? <IssueDetailPage id={route.id} /> : <NotFoundPage />
    case 'notFound':
      return <NotFoundPage />
  }
}
