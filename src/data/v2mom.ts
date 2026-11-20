/**
 * V2MOM 2027, transcribed from the manuscript 「さとうしょうこ V2MOM 2027｜
 * 理念・重点政策・成果指標（草案）」 (Notion, 政策・V2MOM草案 v1.0).
 *
 * Copy the manuscript's wording only — do not add to it or reword it here.
 * Not published on purpose (decided 2026-11-20): 実行ロードマップ（案）,
 * 政策調査・確認事項（未完了）, and links to internal Notion pages.
 *
 * Measures: targets are provisional. Never put a number in `actual` unless
 * it has really been counted; leave it null to show 「集計準備中」.
 */

export const v2momMeta = {
  version: '草案 v1.0',
  /** Date of the manuscript version (YYYY-MM-DD) */
  updated: '2026-11-04',
}

export const vision = {
  title: '誰もが挑戦できる宇部へ。',
  subtitle: '「やってみたい」を、諦めなくていい街。',
  core: '人は、環境と選択肢によって変わる。',
  body:
    '人は、環境と選択肢によって変わる。生まれ育った場所や年齢、性別、家庭環境によって、人生の可能性が狭まってほしくない。多様な人や生き方に出会い、自分の可能性を知る。自分の意思で未来を選び、やりたいことを実現できる。一人ひとりの選択肢が増えることで、人生がもっと自由に、もっと楽しくなる。そんな宇部を目指す。',
  /** The manuscript asks for this to be stated plainly at the top of the page. */
  emphasis: '挑戦を強いるのではなく、やりたいときに選べる環境を増やす。',
}

export interface Value {
  verb: string
  title: string
  body: string
  question: string
}

export const values: Value[] = [
  {
    verb: '知る',
    title: '選択肢を増やす',
    body: '知らないことで可能性を諦めなくていい社会へ。多様な仕事・生き方・学び方に触れる機会を広げる。',
    question: '市民が新しい可能性を知る機会は増えるか？',
  },
  {
    verb: '選ぶ',
    title: '自分で選べる',
    body: '誰かの正解を押し付けない。挑戦することも、しないことも、自分の意思で決められる。',
    question: '本人の意思と選択の自由を尊重できているか？',
  },
  {
    verb: '実現する',
    title: '実現できる環境をつくる',
    body: '意欲だけでは越えられない経済的・時間的・制度的な障壁を減らす。',
    question: '「やってみたい」を妨げる具体的な壁を減らせるか？',
  },
]

/** Methods: the manuscript's short field names and aims. Links go to the policy pages. */
export const methods: { slug: string; field: string; aim: string }[] = [
  { slug: 'education', field: '教育・人材育成', aim: '知らない未来を選べる未来へ' },
  { slug: 'work', field: '仕事・産業', aim: '宇部にいても働き方を選べる' },
  { slug: 'childcare', field: '女性・子育て', aim: 'ライフステージで可能性を狭めない' },
  { slug: 'civic', field: '市民参加・行政改革', aim: 'まちの未来を市民が選べる' },
]

export const principles: { title: string; body: string }[] = [
  { title: '現場から始める', body: '多様な当事者の声とデータの両方を確認する。' },
  { title: 'オープンである', body: '政策の根拠、活動、判断の過程を公開する。' },
  { title: '行動し、改善し続ける', body: '小さく試し、測定し、結果に応じて見直す。' },
]

export const process = ['知る', 'つなぐ', '試す', '測る', '改善する']

export const obstacles: { name: string; response: string }[] = [
  { name: '情報格差', response: '制度の認知度・情報経路を確認し、伝え方を改善' },
  { name: '出会いの不足', response: '地域・世代・学校による機会の偏りを調査' },
  { name: '時間・経済・移動の制約', response: '利用を断念した理由を調べ、参加方法を見直す' },
  { name: '既存制度の使いにくさ', response: '利用実績・申請手続き・相談先を検証' },
  { name: '財源・制度・権限の制約', response: '所管、予算、議会で可能な提案と市の執行権限を区別' },
]

export const measureLayers: { name: string; body: string }[] = [
  { name: 'Output', body: 'ヒアリング、政策調査、交流機会、報告など何を実施したか。' },
  {
    name: 'Outcome',
    body: '新たな選択肢を知った人、相談・学習など次の行動につながった人、改善された障壁。',
  },
  { name: 'Impact', body: '地域・家庭環境による機会格差の縮小、自己決定・挑戦のしやすさ。' },
]

export interface Measure {
  label: string
  target: string
  /** Counted result. null until really counted — the page then shows 「集計準備中」. */
  actual: string | null
  /** Date the actual was counted (YYYY-MM-DD) */
  countedAt: string | null
}

export const measuresPeriod = '2027年4月以降の12か月を想定・未確定'

export const measures: Measure[] = [
  { label: '市民・関係者の声の収集', target: '100件', actual: null, countedAt: null },
  { label: '政策・活動の月次報告', target: '12回', actual: null, countedAt: null },
  { label: '重点政策の調査・提案', target: '4本', actual: null, countedAt: null },
  { label: '受け付けた政策提案の対応状況の記録', target: '100%', actual: null, countedAt: null },
]

export const measuresNote =
  '※上記は本人活動の暫定目標案であり、市の事業成果を保証するものではない。2027年4月を目安に実績・基準値・稼働・運用方法を確認して目標値を確定する。'

export const voiceDefinition: string[] = [
  'Webサイトの意見投稿、対面ヒアリング、意見交換会、メール等を対象とし、収集した意見を100件記録する。同じ人の複数投稿も件数に含めるが、重複投稿や同一内容の再送は集計時に識別する。',
  'チャネル別件数を記録し、把握できる範囲で異なる人の数も別に記録する。投稿者が偏りやすいことを踏まえ、対面での声の収集も続ける。',
  '個人情報は非公開とし、意見の公開は本人の同意・内容確認を経て行う。意見の収集数と公開件数は区別する。',
  '受け付けた政策提案は対応状況を100%記録する。政策検討につながった件数、反映・未反映の理由も可能な範囲で公開する。',
]

export const fieldIndicators: { field: string; body: string }[] = [
  { field: '教育', body: '新しく知った職業・生き方、体験や学習への次の行動。' },
  { field: '仕事', body: '支援制度を知り、相談・学習・起業準備へ進んだ割合。' },
  { field: '子育て', body: '支援制度の利用障壁の特定数、改善状況。' },
  { field: '市民参加', body: '意見受付数、対応状況公開率、参加者の多様性。' },
]
