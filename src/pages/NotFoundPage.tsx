import PageLayout from '../components/PageLayout'
import { routeHref } from '../router'

export default function NotFoundPage() {
  return (
    <PageLayout en="NOT FOUND" title="ページが見つかりません">
      <p>お探しのページは、移動または削除された可能性があります。</p>
      <p className="page__more">
        <a href={routeHref({ name: 'home', anchor: null })} className="btn btn--secondary">
          トップページへ →
        </a>
      </p>
    </PageLayout>
  )
}
