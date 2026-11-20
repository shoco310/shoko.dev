import { useEffect, useRef } from 'react'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import Greeting from './components/Greeting'
import ActivitySection from './components/ActivitySection'
import PolicySection from './components/PolicySection'
import ParticipateSection from './components/ParticipateSection'
import ProfileSection from './components/ProfileSection'
import SupportSection from './components/SupportSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import PolicyDetail from './pages/PolicyDetail'
import DataPage from './pages/DataPage'
import ActivityPage from './pages/ActivityPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFoundPage from './pages/NotFoundPage'
import VoicePage from './pages/VoicePage'
import JoinPage from './pages/JoinPage'
import TakePartSection from './components/TakePartSection'
import { voiceEnabled, volunteerEnabled } from './data/features'
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
  notFound: 'ページが見つかりません',
}

function titleFor(route: Route, policy: Policy | undefined): string {
  if (route.name === 'home') return SITE_TITLE
  if (route.name === 'voice' && !voiceEnabled) return `${pageTitles.notFound} | さとうしょうこ`
  if (route.name === 'join' && !volunteerEnabled) return `${pageTitles.notFound} | さとうしょうこ`
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
  const isFirstRender = useRef(true)

  useEffect(() => {
    document.title = titleFor(route, policy)
  }, [key, policy])

  // On page change: jump to the requested in-page anchor (e.g. "#policy"
  // from a subpage's nav) once the top page has rendered, otherwise start
  // at the top. Move focus to <main> so screen readers announce the new
  // page. Hash changes within the top page are left to the browser.
  useEffect(() => {
    const first = isFirstRender.current
    isFirstRender.current = false

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
      <Header />
      <main ref={mainRef} tabIndex={-1} className="site-main">
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
          <ActivitySection />
          <ProfileSection />
          {(voiceEnabled || volunteerEnabled) && <TakePartSection />}
          <SupportSection />
          <ContactSection />
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
    case 'notFound':
      return <NotFoundPage />
  }
}
