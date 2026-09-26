import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import Greeting from './components/Greeting'
import ActivitySection from './components/ActivitySection'
import PolicySection from './components/PolicySection'
import ProfileSection from './components/ProfileSection'
import SupportSection from './components/SupportSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import PolicyDetail from './pages/PolicyDetail'
import { getPolicyBySlug } from './data/policy'

/**
 * Minimal hash-based routing — no router dependency, so it deploys as-is on
 * GitHub Pages' static hosting (deep links to a path like /policy/education
 * would 404 there without server config; a hash fragment never touches the
 * server). Route shape: '#/policy/<slug>'. Any other hash (including plain
 * in-page anchors like '#message') falls through to the normal one-page
 * layout, and the browser's native anchor scrolling still applies.
 */
function usePolicySlugFromHash() {
  const parse = () => {
    const hash = window.location.hash
    const match = hash.match(/^#\/policy\/([^/?#]+)/)
    return match ? match[1] : null
  }
  const [slug, setSlug] = useState<string | null>(parse)

  useEffect(() => {
    const onHashChange = () => setSlug(parse())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return slug
}

export default function App() {
  const policySlug = usePolicySlugFromHash()
  const policy = policySlug ? getPolicyBySlug(policySlug) : undefined

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [policySlug])

  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        {policy ? (
          <PolicyDetail policy={policy} />
        ) : (
          <>
            <Hero />
            <Greeting />
            <PolicySection />
            <ActivitySection />
            <ProfileSection />
            <SupportSection />
            <ContactSection />
          </>
        )}
      </main>
      <Footer />
    </MotionConfig>
  )
}
