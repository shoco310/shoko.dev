/**
 * 活動予定（#/events）とトップページの「これからの活動」のデータです。
 *
 * ■ 予定を追加する
 *   下の「ひな形」をコピーして `events` 配列のどこかに貼り、内容を書き換えて
 *   保存（GitHub の画面ならコミット）してください。main に入ると自動で公開
 *   されます。並び順は自動で日付順になります。
 *
 * ■ 終わったら
 *   何もしなくて大丈夫です。開催日（終了時刻）を過ぎると自動で
 *   「終了した活動」に移ります。活動報告を書いたら `reportActivityId`
 *   （src/data/activity.ts の id）か `reportUrl` を足すと、リンクが出ます。
 *
 * ■ 中止・延期になったら
 *   `status: 'cancelled'`（中止）または `status: 'postponed'`（延期）を足します。
 *   予定は消さずに残してください（来る予定だった方への案内になります）。
 *
 * ■ 書かないこと
 *   参加者の名前や連絡先、個人の住所は書かないでください。
 *   選挙での投票のお願いにあたる内容は書かないでください。
 *
 * ひな形（コピー用）:
 *
 *   {
 *     id: '2026-12-05-ikenkoukan',          // 日付-短い英数字（重複しないもの）
 *     title: '子育てについての意見交換会',
 *     date: '2026-12-05',                     // 開催日 YYYY-MM-DD
 *     start: '14:00',                         // 任意 HH:MM
 *     end: '15:30',                           // 任意 HH:MM
 *     place: '宇部市〇〇ふれあいセンター 会議室', // 任意
 *     description: '子育て中の方と、困りごとや必要な支援について話し合います。',
 *     audience: 'どなたでも（お子さま連れ歓迎）',  // 任意
 *     howToJoin: '申込不要。直接会場へお越しください。', // 任意
 *     applyUrl: 'https://forms.gle/xxxx',     // 任意（申込フォームなど）
 *   },
 *
 * `npm test`（と本番のビルド）で、日付の形式や id の重複を自動で確認します。
 */
export type EventStatusOverride = 'cancelled' | 'postponed'

export interface EventItem {
  /** Unique, stable id: 'YYYY-MM-DD-short-name' */
  id: string
  title: string
  /** YYYY-MM-DD (Japan time) */
  date: string
  /** HH:MM (Japan time) */
  start?: string
  /** HH:MM (Japan time) */
  end?: string
  place?: string
  /** Map or venue page */
  placeUrl?: string
  description: string
  /** Who it is for */
  audience?: string
  /** How to take part (free text) */
  howToJoin?: string
  /** Application form or event page */
  applyUrl?: string
  /** Only for cancellations / postponements; upcoming vs ended is automatic */
  status?: EventStatusOverride
  /** id in src/data/activity.ts for the report written afterwards */
  reportActivityId?: string
  /** Report URL when it is not in activity.ts */
  reportUrl?: string
}

export const events: EventItem[] = [
  {
    id: '2026-04-18-genai-event',
    title: '生成AIを「基礎 → 実践」まで体験するイベント',
    date: '2026-04-18',
    description: '講演とワークショップの形式で、生成AIを基礎から実践まで体験していただきました。',
    reportActivityId: '2',
  },
  {
    id: '2025-10-16-engineer-community-talk',
    title: '「エンジニア×地域コミュニティ〜宇部のこれから〜」に登壇',
    date: '2025-10-16',
    description: 'エンジニアの視点から、地域コミュニティと宇部のこれからについてお話ししました。',
    reportActivityId: '6',
  },
]
