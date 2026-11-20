import PageLayout, { PageSection } from '../components/PageLayout'
import { operator, privacyPolicyDate, supportersAssociation } from '../data/site'
import { voiceEnabled } from '../data/features'

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/**
 * Keep this page in step with what the code and services actually do:
 * - retention: supabase/migrations (purge_expired_contacts / purge_old_submissions)
 * - analytics: src/analytics.ts (not loaded on the submission page)
 * - services: vercel.json, api/submit.ts, src/components/Turnstile.tsx
 */
const services = [
  {
    name: 'Vercel（Vercel Inc.・米国）',
    use: 'このサイトの配信、投稿の受付処理、アクセスログの記録',
    where: '投稿の受付処理は東京リージョンで行います。アクセスログは同社のシステムで管理され、日本国外で保存・処理される場合があります。',
  },
  ...(voiceEnabled
    ? [
        {
          name: 'Supabase（Supabase Inc.・米国）',
          use: '投稿内容・連絡先の保存、運営者のログイン管理',
          where: 'データは東京リージョン（Amazon Web Services の日本国内のデータセンター）に保存します。同社による保守・障害対応のため、日本国外からアクセスされる可能性があります。',
        },
        {
          name: 'Cloudflare Turnstile（Cloudflare, Inc.・米国）',
          use: '投稿フォームでの、ロボットによる送信かどうかの判定',
          where: 'ブラウザや端末の情報が、同社の日本国外を含む設備で処理されます。',
        },
      ]
    : []),
  {
    name: 'Google アナリティクス（Google LLC・米国）',
    use: 'アクセス解析（投稿フォームのページでは使用しません）',
    where: '収集された情報は、日本国外を含む同社の設備で保存・処理されます。',
  },
  {
    name: 'Gmail（Google LLC・米国）',
    use: 'お問い合わせメールの受信・保管',
    where: 'メールは、日本国外を含む同社の設備で保存されます。',
  },
]

export default function PrivacyPage() {
  return (
    <PageLayout
      en="PRIVACY"
      title="プライバシーポリシー"
      lead={`このサイトの運営者である${operator.name}（さとうしょうこ。以下「運営者」）は、このサイトを通じて得た個人情報を、個人情報の保護に関する法律その他の法令を守って取り扱います。`}
    >
      <PageSection title="1. 取得する情報と利用目的">
        <dl className="info-list info-list--stacked">
          <div>
            <dt>お問い合わせ（メール・LINE・SNS）</dt>
            <dd>
              お名前、連絡先、お問い合わせの内容をいただくことがあります。お問い合わせへの返信・対応のために利用します。
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
                  利用目的は、政策の検討・改善の参考にすること、内容の確認やご希望の方への返信、不正な送信の防止です。投稿を読み、審査するのは運営者本人です。選挙での投票のお願いや、選挙運動のための連絡先の収集には利用しません。
                </p>
                <p>
                  投稿の原文は公開しません。政策の検討に活かす場合は、運営者本人が内容を確認したうえで、個人が特定できる内容を除いて要約し、課題としてこのサイトで紹介することがあります。
                </p>
              </dd>
            </div>
          )}
          <div>
            <dt>アクセス解析（Google アナリティクス）</dt>
            <dd>
              サイトの改善のため、Google アナリティクスを利用しています。Cookie を使って、閲覧したページ、ブラウザや端末の種類、おおよその地域などの情報が Google に送られます。この情報には、お名前やメールアドレスなど個人を直接特定する情報は含まれません。
              {voiceEnabled && '投稿フォームのページでは、Google アナリティクスを読み込みません。'}
              Google によるデータの扱いは「
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
              サイトの運用と安全の確保のため、IP アドレス、アクセスした日時・ページ、ブラウザの種類などが、サイトを配信しているサーバー（Vercel）に記録されます。
            </dd>
          </div>
        </dl>
      </PageSection>

      {voiceEnabled && (
        <PageSection title="2. 保存期間">
          <dl className="info-list info-list--stacked">
            <div>
              <dt>連絡先（お名前・メールアドレス・返信の希望）</dt>
              <dd>
                投稿内容とは分けて保管し、対応を終えてから6か月後に削除します。対応が終わっていない場合でも、受け付けから1年後には削除します。
              </dd>
            </div>
            <div>
              <dt>投稿の原文</dt>
              <dd>
                最後に対応した日から5年を上限として保管し、その後に削除します。このサイトで公開する課題の要約（政策検討の記録）は、原文とは分けて管理します。
              </dd>
            </div>
          </dl>
        </PageSection>
      )}

      <PageSection title={`${voiceEnabled ? 3 : 2}. 第三者への提供`}>
        <p>
          ご本人の同意がある場合、または法令に基づく場合を除き、個人情報を第三者に提供することはありません。次の項目の外部サービスには、サイトの運営に必要な範囲で、情報の保管や処理を任せています。
        </p>
      </PageSection>

      <PageSection title={`${voiceEnabled ? 4 : 3}. 利用している外部サービスと、外国にある事業者について`}>
        <p>
          このサイトでは、次の外部サービスを利用しています。いずれも米国の事業者です。
        </p>
        <dl className="info-list info-list--stacked">
          {services.map(s => (
            <div key={s.name}>
              <dt>{s.name}</dt>
              <dd>
                <p>用途：{s.use}</p>
                <p>保存・処理の場所：{s.where}</p>
              </dd>
            </div>
          ))}
        </dl>
        <p>
          米国には、日本の個人情報保護法に相当する、すべての分野に共通する連邦法はありません。分野ごとの連邦法や、州の法律（カリフォルニア州消費者プライバシー法など）によって個人情報が保護されています。各事業者による情報の扱いは、それぞれのプライバシーポリシーをご確認ください。
        </p>
      </PageSection>

      <PageSection title={`${voiceEnabled ? 5 : 4}. 安全管理`}>
        <p>
          個人情報は、運営者本人だけが扱えるようにし、漏えいや紛失がないよう管理します。
          {voiceEnabled &&
            '投稿を確認する管理画面は、パスワードと二段階認証でログインした運営者本人だけが使え、連絡先を表示した記録や対応の記録を残しています。通信はすべて暗号化しています。'}
          利用目的を達成し、保管する必要がなくなった情報は削除します。
        </p>
      </PageSection>

      <PageSection title={`${voiceEnabled ? 6 : 5}. 開示・訂正・削除のご請求`}>
        <p>
          運営者が保有するご自身の個人情報について、開示・訂正・利用停止・削除をご希望の場合は、下記のメールアドレスまでご連絡ください。
          {voiceEnabled && '投稿についてのご請求の際は、受付番号をお知らせいただくと確認がスムーズです。'}
          ご本人であることを確認したうえで対応します。
        </p>
      </PageSection>

      <PageSection title={`${voiceEnabled ? 7 : 6}. このポリシーの改定`}>
        <p>
          このポリシーは、必要に応じて改定することがあります。改定した場合は、このページでお知らせします。
        </p>
      </PageSection>

      <PageSection title="後援会の入会フォームについて">
        <p>
          後援会の入会フォーム（Google フォーム）は、{supportersAssociation}（代表：{operator.name}）が運営しています。入力された情報は、{supportersAssociation}が、後援会の運営と会員の方へのご連絡のために利用します。
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
