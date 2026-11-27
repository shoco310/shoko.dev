/**
 * Title and description of each page, for the browser tab, search engines
 * and SNS previews (OGP). Used by App.tsx at runtime and by the build
 * (vite.config.ts → scripts/pageHtml.ts), which writes one HTML file per
 * page with these in <head>, plus sitemap.xml.
 *
 * Descriptions reuse text the pages already show (leads, taglines, the
 * first paragraph of each policy) — nothing here should say more than the
 * page itself. Pure data: no import.meta, so the build can import it.
 */
import { policies, type Policy } from './policy'
import { vision } from './v2mom'

export const SITE_NAME = 'さとうしょうこ'
export const SITE_URL = 'https://shoko.dev'
export const SITE_TITLE = 'さとうしょうこ | 誰もが挑戦できる宇部へ'

export type StaticPageName =
  | 'profile'
  | 'vision'
  | 'policies'
  | 'research'
  | 'data'
  | 'activity'
  | 'about'
  | 'privacy'
  | 'voice'
  | 'join'
  | 'issues'
  | 'changes'
  | 'events'

export interface PageMeta {
  /** Shown before ' | さとうしょうこ' */
  title: string
  description: string
  /** Page behind a feature flag: left out of the sitemap when it is off. */
  flag?: 'voice' | 'volunteer' | 'issues'
}

export const staticPages: Record<StaticPageName, PageMeta> = {
  profile: {
    title: '私について',
    description: 'さとうしょうこのプロフィールと、宇部への想い。',
  },
  vision: {
    title: 'V2MOM（目指す未来）',
    description: `${vision.title}${vision.subtitle}${vision.emphasis}`,
  },
  policies: {
    title: '4つの重点政策',
    description: `${policies.map(p => p.name).join('、')}。すべての政策に「知る → 選ぶ → 実現する」を通します。`,
  },
  research: {
    title: '政策調査',
    description:
      '政策の根拠となる情報を、宇部市の公式資料などで確認しています。確認できたこと・まだ確認できていないことを分けて掲載しています。',
  },
  data: {
    title: '数字で見る宇部',
    description:
      '宇部市の計画書やアンケート調査など、公式な資料で確認できた数字だけを、政策のテーマごとにまとめています。',
  },
  activity: {
    title: 'これまでの活動',
    description: 'これまでに行った活動を、新しい順に掲載しています。',
  },
  about: {
    title: 'このサイトについて',
    description:
      'このサイトは、さとうしょうこが個人で運営する、政治活動・政策発信のためのウェブサイトです。宇部市の公式サイトや、行政のサービスではありません。',
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: 'このサイトを通じて得た個人情報の取り扱いについて。',
  },
  voice: {
    title: '困りごと・ご意見を送る',
    description: '宇部での暮らしの中の困りごとや、政策へのご意見をお寄せください。政策づくりの参考にします。',
    flag: 'voice',
  },
  join: {
    title: '一緒に活動する',
    description:
      '宇部の未来を、一緒につくりませんか？地域の課題を知り、政策を考え、日々の活動を支えてくださるボランティアを募集しています。',
    flag: 'volunteer',
  },
  issues: {
    title: '市民の声',
    description:
      '寄せられた困りごとやご意見をもとに、個人が特定できないよう要約した課題と、その後の取り組みの状況を公開しています。',
    flag: 'issues',
  },
  changes: {
    title: '政策の変更履歴',
    description: '政策をいつ、なぜ、何をもとに変えたのかを公開しています。過去の記録は消さずに残します。',
  },
  events: {
    title: 'イベント・活動予定',
    description: '意見交換会や地域での活動など、これから開催する予定をお知らせします。',
  },
}

export const homeMeta = {
  title: SITE_TITLE,
  description:
    '宇部から新しい挑戦を。さとうしょうこ公式サイト。教育・人材育成、仕事・産業振興、女性・子育て支援、市民参加・行政改革に取り組みます。',
}

/** Cut to about 120 characters for search results and SNS cards. */
function clip(text: string, max = 120) {
  return text.length <= max ? text : text.slice(0, max - 1) + '…'
}

export function policyMeta(policy: Policy): PageMeta {
  return {
    title: policy.name,
    description: clip(`${policy.tagline}${policy.background[0] ?? ''}`),
  }
}

export function pageTitle(title: string) {
  return `${title} | ${SITE_NAME}`
}

export { policies }
