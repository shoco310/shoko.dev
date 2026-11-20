import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Badge, Breadcrumb, ButtonLink, Card, Notice, SectionHeading } from '../src/components/ui'
import PageLayout from '../src/components/PageLayout'

const html = (node: React.ReactElement) => renderToStaticMarkup(node)

describe('ButtonLink', () => {
  it('uses the existing button classes for primary/secondary', () => {
    expect(html(<ButtonLink href="#/voice">送る</ButtonLink>)).toBe(
      '<a href="#/voice" class="btn btn--primary">送る</a>',
    )
    expect(html(<ButtonLink href="#/join" variant="secondary" size="lg">参加</ButtonLink>)).toContain(
      'class="btn btn--secondary btn--lg"',
    )
  })

  it('opens external links in a new tab only', () => {
    const ext = html(<ButtonLink href="https://note.com/x">note</ButtonLink>)
    expect(ext).toContain('target="_blank"')
    expect(ext).toContain('rel="noopener noreferrer"')
    expect(html(<ButtonLink href="#/events">予定</ButtonLink>)).not.toContain('target=')
  })

  it('text variant adds a decorative arrow hidden from screen readers', () => {
    expect(html(<ButtonLink href="#/vision" variant="text">詳しく</ButtonLink>)).toBe(
      '<a href="#/vision" class="ui-textlink">詳しく<span aria-hidden="true">→</span></a>',
    )
  })
})

describe('SectionHeading', () => {
  it('hides the English kicker from screen readers and renders the right level', () => {
    const out = html(<SectionHeading kicker="Policy" title="4つの重点政策" level={2} id="p" />)
    expect(out).toContain('<span class="ui-heading__kicker" aria-hidden="true">Policy</span>')
    expect(out).toContain('<h2 id="p" class="ui-heading__title ui-heading__title--h2">4つの重点政策</h2>')
  })
})

describe('Card', () => {
  it('makes the title the single link when href is given', () => {
    const out = html(<Card href="#/policy/education" title="教育" linkLabel="詳しく見る" />)
    expect(out.match(/<a /g)).toHaveLength(1)
    expect(out).toContain('<h3 class="ui-card__title"><a href="#/policy/education" class="ui-card__link">教育</a></h3>')
    expect(out).toContain('aria-hidden="true">詳しく見る →</span>')
  })

  it('renders a plain card without a link', () => {
    const out = html(<Card title="お知らせ">本文</Card>)
    expect(out).not.toContain('<a ')
    expect(out).toContain('class="ui-card"')
  })
})

describe('Breadcrumb', () => {
  it('links parents and marks the last item as the current page', () => {
    const out = html(
      <Breadcrumb items={[{ label: 'ホーム', href: '/' }, { label: '政策', href: '#/policies' }, { label: '教育' }]} />,
    )
    expect(out).toContain('aria-label="パンくずリスト"')
    expect(out).toContain('<a href="#/policies">政策</a>')
    expect(out).toContain('<span aria-current="page">教育</span>')
  })
})

describe('Badge and Notice', () => {
  it('render their tone classes', () => {
    expect(html(<Badge tone="pink">調査中</Badge>)).toBe('<span class="ui-badge ui-badge--pink">調査中</span>')
    expect(html(<Notice title="注意">x</Notice>)).toContain('class="ui-notice ui-notice--info"')
  })
})

describe('PageLayout', () => {
  it('keeps the back link when no breadcrumb is given', () => {
    const out = html(
      <PageLayout en="About" title="このサイトについて">
        x
      </PageLayout>,
    )
    expect(out).toContain('← トップページへ')
    expect(out).not.toContain('パンくずリスト')
  })

  it('shows ホーム › parents › title when a breadcrumb is given', () => {
    const out = html(
      <PageLayout en="Vision" title="V2MOM" breadcrumb={[{ label: 'V2MOM・政策' }]}>
        x
      </PageLayout>,
    )
    expect(out).toContain('パンくずリスト')
    expect(out).toContain('<span aria-current="page">V2MOM</span>')
    expect(out).not.toContain('← トップページへ')
  })
})
