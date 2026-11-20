import PageLayout from '../components/PageLayout'
import ProfileSection from '../components/ProfileSection'
import Greeting from '../components/Greeting'
import StorySection from '../components/StorySection'

/**
 * 私について: the full profile and the full 「宇部で、挑戦する人を増やしたい。」
 * message, moved here from the top page without changing the wording.
 */
export default function ProfilePage() {
  return (
    <PageLayout en="ABOUT ME" title="私について" breadcrumb={[]} bare>
      <ProfileSection />
      <StorySection />
      <Greeting en="MY HOPE" title="宇部への想い" />
    </PageLayout>
  )
}
