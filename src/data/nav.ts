import { routeHref, type Route } from '../router'
import { issuesEnabled, voiceEnabled, volunteerEnabled } from './features'
import { policies } from './policy'
import { associationFormUrl, lineUrl } from './social'

export type NavLink = {
  label: string
  href: string
  /** Routes on which this link is the current section (for aria-current). */
  match: Route['name'][]
  /** Extra links shown under this one in menus (the four policies). */
  sub?: { label: string; href: string; slug?: string }[]
}

export type NavItem = NavLink & { children?: NavLink[] }

/** "V2MOM・政策" menu: two main pages plus the supporting ones. */
export const policyMenu: NavLink[] = [
  { label: 'V2MOM（目指す未来）', href: routeHref({ name: 'vision' }), match: ['vision'] },
  {
    label: '4つの重点政策',
    href: routeHref({ name: 'policies' }),
    match: ['policies', 'policy'],
    sub: policies.map(p => ({
      label: `${p.number} ${p.name}`,
      href: routeHref({ name: 'policy', slug: p.slug }),
      slug: p.slug,
    })),
  },
  { label: '数字で見る宇部', href: routeHref({ name: 'data' }), match: ['data'] },
  { label: '政策の変更履歴', href: routeHref({ name: 'changes' }), match: ['changes'] },
]

/** Header order: ホーム｜私について｜V2MOM・政策｜活動｜市民の声 */
export const mainNav: NavItem[] = [
  { label: 'ホーム', href: routeHref({ name: 'home', anchor: null }), match: ['home'] },
  { label: '私について', href: routeHref({ name: 'profile' }), match: ['profile'] },
  {
    label: 'V2MOM・政策',
    href: routeHref({ name: 'vision' }),
    match: ['vision', 'policies', 'policy', 'data', 'changes'],
    children: policyMenu,
  },
  { label: '活動', href: routeHref({ name: 'activity' }), match: ['activity', 'events', 'report'] },
  {
    label: '市民の声',
    // The public list is the hub; without it, the form is the only voice page.
    href: issuesEnabled ? routeHref({ name: 'issues' }) : routeHref({ name: 'voice' }),
    match: ['issues', 'issue', 'voice'],
  },
]

export type ParticipateOption = { label: string; description: string; href: string; external?: boolean }

/** Choices behind the header's 「参加する」 button. */
export const participateOptions: ParticipateOption[] = [
  ...(voiceEnabled
    ? [
        {
          label: '市民の声を届ける',
          description: '困りごとやご意見を送る。どなたでも、内容は公開されません。',
          href: routeHref({ name: 'voice' }),
        },
      ]
    : []),
  ...(volunteerEnabled
    ? [
        {
          label: '後援会・ボランティアとして参加する',
          description: '活動のお手伝いをする（さとうしょうこ後援会）。',
          href: routeHref({ name: 'join' }),
        },
      ]
    : [
        {
          label: '後援会に入会する',
          description: 'さとうしょうこ後援会の入会フォーム（外部サイト）。',
          href: associationFormUrl,
          external: true,
        },
      ]),
]

export const lineOption: ParticipateOption = {
  label: 'LINE公式で活動のお知らせを受け取る',
  description: '',
  href: lineUrl,
  external: true,
}

export function isCurrent(link: Pick<NavLink, 'match'>, route: Route): boolean {
  return link.match.includes(route.name as Route['name'])
}
