export default function ProfileSection() {
  return (
    <section id="profile" className="section section--roomy">
      <div className="container">
        <div>
          <div className="section-heading">
            <span className="section-heading__en">PROFILE</span>
            <h2 className="section-heading__ja">プロフィール</h2>
            <div className="section-heading__line" />
          </div>

          <div className="profile-box">
            <div className="profile-photo">
              <img
                src="/images/profile-900.png"
                alt="さとうしょうこ"
                loading="lazy"
                decoding="async"
                width={684}
                height={674}
              />
            </div>

            <div className="profile-content">
              <h3>さとうしょうこ</h3>
              <div className="profile-content__rule" aria-hidden="true" />

              <p>
                宇部市東岐波出身。13年前に東京へ移住し、ITエンジニアとしてキャリアを築く。
                LINE（現LINEヤフー）の技術広報をはじめ、技術コミュニティ運営に長年携わる。
                2024年に自身の会社を設立。
              </p>

              <p>
                技術コミュニティやイベント運営を通じて、人と人がつながり、
                新しい挑戦が生まれる場づくりに取り組んできました。
              </p>

              <p>
                これまでの経験を地域に還元し、宇部で暮らす人たちが
                自分らしく挑戦できるまちづくりを進めていきます。
              </p>

              <a
                className="profile-award"
                href="https://x.com/satoshoco/status/2015564827700376016"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="profile-award__icon" aria-hidden="true">🏆</span>
                <span className="profile-award__text">
                  Forbes JAPAN「Women in Tech 30」2026 選出
                  <br />
                  ― テクノロジー領域で世界を変える30人 ―
                  <span className="profile-award__more">
                    X の投稿を見る <span aria-hidden="true">↗</span>
                    <span className="visually-hidden">（新しいタブで開きます）</span>
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
