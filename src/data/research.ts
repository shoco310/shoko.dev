/**
 * Public summary of where policy research stands. Source of truth is
 * docs/research/ (summary.md, README.md) — every item here must match a
 * statement there. Do not mark something 'confirmed' unless the research
 * docs record it as confirmed against a primary source (✅).
 */
export type ResearchStatus = 'confirmed' | 'next' | 'open'

export interface ResearchItem {
  status: ResearchStatus
  title: string
  detail?: string
}

export interface ResearchGroup {
  /** Matches Policy.slug */
  policySlug: string
  items: ResearchItem[]
}

/** Date the research docs were last updated (YYYY-MM-DD) */
export const researchAsOf = '2026-09-27'

export const researchStatusLabel: Record<ResearchStatus, string> = {
  confirmed: '確認済み',
  next: '次に確認すること',
  open: '今後の課題',
}

export const researchGroups: ResearchGroup[] = [
  {
    policySlug: 'education',
    items: [
      {
        status: 'confirmed',
        title: '不登校の児童生徒数、就学援助の認定率',
        detail: '宇部市こども計画（令和7年3月）で確認しました。',
      },
      {
        status: 'next',
        title: '「宇部市こどもの生活実態調査」の原本',
        detail: '公開されていた資料の URL が見つからなくなっているため、再検索または担当課への確認が必要です。',
      },
      {
        status: 'open',
        title: 'IT・AI 教育、キャリア教育の実施状況',
      },
      {
        status: 'open',
        title: '学校に通っていない子ども本人の声',
        detail: '保護者向けの調査はありますが、子ども本人への調査は確認できていません。',
      },
    ],
  },
  {
    policySlug: 'work',
    items: [
      {
        status: 'confirmed',
        title: '若者が市外へ出る理由、企業の人材不足',
        detail: '宇部市が令和6年に実施した高校生・大学生等・企業へのアンケートで確認しました。',
      },
      {
        status: 'next',
        title: 'シルバー人材センターの登録者数・紹介実績',
        detail: 'Web 上に公開情報がないため、直接の確認が必要です。',
      },
      {
        status: 'open',
        title: 'リスキリングの実施状況、事業承継支援の窓口',
      },
      {
        status: 'open',
        title: '中小企業の DX・事業承継についての経営者の声',
      },
    ],
  },
  {
    policySlug: 'childcare',
    items: [
      {
        status: 'confirmed',
        title: '子どもを持つことについての若い世代の考え、学童保育クラブの満足度',
        detail: '宇部市のこども・若者アンケート（令和6年）と、学童保育クラブ利用者アンケート（令和6年度）で確認しました。',
      },
      {
        status: 'next',
        title: '待機児童の定義と人数',
        detail: '公表されている情報だけでは確認できず、担当課への確認が必要です。',
      },
      {
        status: 'open',
        title: '女性の再就職支援の実績、ひとり親家庭のデータ',
        detail: '再就職支援は現在、県のデータのみ確認しています。',
      },
      {
        status: 'open',
        title: '学童保育クラブアンケートの自由記述',
        detail: '自由記述は各クラブに個別に提供されており、市全体の傾向は公開されていません。',
      },
    ],
  },
  {
    policySlug: 'civic',
    items: [
      {
        status: 'confirmed',
        title: 'パブリックコメントへの意見の提出状況（2件）',
        detail:
          '人口ビジョン・総合戦略の改訂素案に対する意見は0〜1件でした。確認したのはこの2件だけで、制度全体の評価ではありません。',
      },
      {
        status: 'open',
        title: 'パブリックコメントに意見が集まりにくい理由',
        detail: '制度を知らないのか、出しても変わらないと感じているのかなど、市民の方へのヒアリングが必要です。',
      },
      {
        status: 'open',
        title: '公共交通の地区ごとの困りごと',
      },
      {
        status: 'open',
        title: 'マイナンバーカードの交付率',
      },
    ],
  },
]
