import Header from './components/Header'
import Hero from './components/Hero'
import Greeting from './components/Greeting'
import ActivitySection from './components/ActivitySection'
import PolicySection from './components/PolicySection'
import ProfileSection from './components/ProfileSection'
import SupportSection from './components/SupportSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Greeting />
        <PolicySection />
        <ActivitySection />
        <ProfileSection />
        <SupportSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
