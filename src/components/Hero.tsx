import { voiceEnabled, volunteerEnabled } from '../data/features'
import { routeHref } from '../router'
import { associationFormUrl, lineUrl } from '../data/social'
import { ButtonLink } from './ui'

/**
 * Top-page main visual: copy, name, short introduction and the two ways to
 * take part on the left; a modest photo on the right. SNS links live in
 * the footer.
 */
export default function Hero() {
  return (
    <section className="home-hero" id="top" aria-label="ファーストビュー">
      <div className="container home-hero__inner">
        <div className="home-hero__text">
          <p className="label">宇部から、新しい挑戦を。</p>
          <p className="home-hero__catch">
            誰もが挑戦できる宇部へ。
            <span>「やってみたい」を、諦めなくていい街。</span>
          </p>
          <h1 className="home-hero__name">
            さとうしょうこ
            <span lang="en">Shoko Sato</span>
          </h1>
          <p className="home-hero__desc">
            宇部で暮らす一人ひとりが、自分らしく学び、働き、子育てし、挑戦できるまちを目指して活動しています。
          </p>

          <div className="home-hero__actions">
            {voiceEnabled || volunteerEnabled ? (
              <>
                {voiceEnabled && (
                  <ButtonLink href={routeHref({ name: 'voice' })} size="lg">
                    困りごと・ご意見を送る
                  </ButtonLink>
                )}
                {volunteerEnabled && (
                  <ButtonLink href={routeHref({ name: 'join' })} variant={voiceEnabled ? 'secondary' : 'primary'} size="lg">
                    一緒に活動する
                  </ButtonLink>
                )}
              </>
            ) : (
              <>
                <ButtonLink href={lineUrl} size="lg">
                  LINE公式に登録する
                </ButtonLink>
                <ButtonLink href={associationFormUrl} variant="secondary" size="lg">
                  後援会に入会する
                </ButtonLink>
              </>
            )}
          </div>
          <p className="home-hero__more">
            <ButtonLink href={routeHref({ name: 'profile' })} variant="text">
              私について
            </ButtonLink>
          </p>
        </div>

        <figure className="home-hero__photo">
          <img
            src="/images/hero-main-1000.jpg"
            alt="さとうしょうこ"
            width={1000}
            height={562}
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      </div>
    </section>
  )
}
