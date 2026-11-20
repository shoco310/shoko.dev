import PageLayout, { PageSection } from '../components/PageLayout'
import { operator, privacyPolicyDate, supportersAssociation } from '../data/site'
import { voiceEnabled } from '../data/features'

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

export default function PrivacyPage() {
  return (
    <PageLayout
      en="PRIVACY"
      title="プライバシーポリシー"
      lead={`このサイトの運営者である${operator.displayName}（以下「運営者」）は、このサイトを通じて得た個人情報を、個人情報の保護に関する法律その他の法令を守って取り扱います。`}
    >
      <PageSection title="1. 取得する情報と利用目的">
        <dl className="info-list info-list--stacked">
          <div>
            <dt>お問い合わせ（メール・LINE・SNS）</dt>
            <dd>
              お名前、連絡先、お問い合わせの内容をいただくことがあります。お問い合わせへの返信・対応のために利用します。
            </dd>
          </div>
          <div>
            <dt>後援会の入会フォーム（Google フォーム）</dt>
            <dd>
              フォームに入力された情報を、{supportersAssociation}の運営と、会員の方へのご連絡のために利用します。{supportersAssociation}の代表は運営者が務めており、運営者が管理します。
            </dd>
          </div>
          {voiceEnabled && (
            <div>
              <dt>困りごと・ご意見の投稿フォーム</dt>
              <dd>
                <p>
                  投稿内容と、任意で入力いただいたテーマ・地区・年代・お名前・メールアドレス・返信の希望をお預かりします。あわせて、いたずらや大量送信を防ぐため、送信元の IP アドレスを元に戻せない形に変換した値（ハッシュ値）を記録します。IP アドレスそのものは保存しません。
                </p>
                <p>
                  利用目的は、政策づくりの参考にすること、内容の確認やご希望の方への返信、不正な送信の防止です。投稿は運営者が確認します。原文を公開することはありません。参考にさせていただく場合は、個人が特定できる内容を除いて要約し、課題としてこのサイトで紹介することがあります。
                </p>
                <p>
                  お名前・メールアドレスなどの連絡先は、投稿内容とは分けて保管し、対応を終えてから6か月後（最長でも受け付けから1年後）に削除します。投稿内容は、政策検討の記録として保管します。
                </p>
                <p>
                  投稿の保管には Supabase（データは日本国内の東京リージョンに保存）を、不正な送信の防止には Cloudflare の Turnstile を利用しています。Turnstile は、ロボットによる送信かどうかを判定するため、ブラウザや端末の情報を Cloudflare に送信します。
                </p>
              </dd>
            </div>
          )}
          <div>
            <dt>アクセス解析（Google アナリティクス）</dt>
            <dd>
              サイトの改善のため、Google アナリティクスを利用しています。Cookie を使って、閲覧したページ、ブラウザや端末の種類、おおよその地域などの情報が Google に送られます。この情報には、お名前やメールアドレスなど個人を直接特定する情報は含まれません。Google によるデータの扱いは「
              <a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer">
                Google のサービスを使用するサイトやアプリから収集した情報の Google による使用
              </a>
              」をご覧ください。収集を望まない場合は、
              <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer">
                Google アナリティクス オプトアウト アドオン
              </a>
              で無効にできます。
            </dd>
          </div>
          <div>
            <dt>アクセスログ</dt>
            <dd>
              このサイトは Vercel Inc. のサービスで公開しています。サイトの運用と安全の確保のため、IP アドレス、アクセスした日時・ページ、ブラウザの種類などがサーバーに記録されます。
            </dd>
          </div>
        </dl>
      </PageSection>

      <PageSection title="2. 第三者への提供">
        <p>
          ご本人の同意がある場合、または法令に基づく場合を除き、個人情報を第三者に提供することはありません。
        </p>
      </PageSection>

      <PageSection title="3. 安全管理">
        <p>
          個人情報は、必要な人だけが扱えるようにし、漏えいや紛失がないよう管理します。利用目的を達成し、保管する必要がなくなった情報は削除します。
        </p>
      </PageSection>

      <PageSection title="4. 開示・訂正・削除のご請求">
        <p>
          運営者が保有するご自身の個人情報について、開示・訂正・利用停止・削除をご希望の場合は、下記の窓口までご連絡ください。ご本人であることを確認したうえで対応します。
        </p>
      </PageSection>

      <PageSection title="5. このポリシーの改定">
        <p>
          このポリシーは、必要に応じて改定することがあります。今後、ご意見の投稿やお知らせのメール配信などの機能を追加する際には、取り扱う情報と利用目的をこのページに追記したうえで公開します。
        </p>
      </PageSection>

      <PageSection title="個人情報の管理責任者・お問い合わせ窓口">
        <dl className="info-list">
          <div>
            <dt>管理責任者</dt>
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
        <p className="page__date">{formatDate(privacyPolicyDate)} 制定</p>
      </PageSection>
    </PageLayout>
  )
}
