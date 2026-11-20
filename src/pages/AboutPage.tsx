import PageLayout, { PageSection } from '../components/PageLayout'
import { operator } from '../data/site'
import { routeHref } from '../router'

export default function AboutPage() {
  return (
    <PageLayout en="ABOUT" title="このサイトについて">
      <div className="policy-detail__note page__notice">
        <p>
          <strong>
            このサイトは、{operator.displayName}が個人で運営する、政治活動・政策発信のためのウェブサイトです。宇部市の公式サイトや、行政のサービスではありません。
          </strong>
        </p>
        <p>
          宇部市への手続き・申請・相談は、
          <a href="https://www.city.ube.yamaguchi.jp/" target="_blank" rel="noopener noreferrer">
            宇部市公式ウェブサイト
          </a>
          や市の各窓口をご利用ください。
        </p>
      </div>

      <PageSection title="掲載している情報について">
        <p>
          政策ページや「
          <a href={routeHref({ name: 'data' })}>数字で見る宇部</a>
          」の数字は、宇部市の計画書・アンケート調査などの公式資料で確認できたものだけを掲載し、出典を記載しています。確認できたこと、調査結果から推測していること、まだ調べていることは、それぞれ分けて書いています。
        </p>
        <p>
          政策は、調査の結果やいただいたご意見をもとに見直していきます。見直した内容は、各政策ページの「更新履歴」で公開しています。調査がどこまで進んでいるかは「
          <a href={routeHref({ name: 'activity' })}>活動・調査の状況</a>
          」でご覧いただけます。
        </p>
        <p>掲載内容に誤りや古くなった情報を見つけた場合は、下記の連絡先までお知らせください。</p>
      </PageSection>

      <PageSection title="外部サービスへのリンク">
        <p>
          このサイトには、LINE・Instagram・X・YouTube・Facebook・note、後援会入会フォーム（Google フォーム）など、外部のサービスへのリンクがあります。リンク先での情報の取り扱いは、各サービスの規約・方針に従います。
        </p>
      </PageSection>

      <PageSection title="運営者">
        <dl className="info-list">
          <div>
            <dt>運営者</dt>
            <dd>{operator.displayName}</dd>
          </div>
          <div>
            <dt>所在地</dt>
            <dd>{operator.address}</dd>
          </div>
          <div>
            <dt>メール</dt>
            <dd>{operator.emailDisplay}</dd>
          </div>
        </dl>
        <p className="page__more">
          <a href={routeHref({ name: 'privacy' })}>プライバシーポリシー →</a>
        </p>
      </PageSection>
    </PageLayout>
  )
}
