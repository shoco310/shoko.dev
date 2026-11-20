import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'
import Dashboard from './Dashboard'
import VolunteerDashboard from './VolunteerDashboard'
import IssuesDashboard, { type PendingSource } from './IssuesDashboard'
import EventsAdmin from './EventsAdmin'

type Phase =
  | { name: 'loading' }
  | { name: 'signedOut' }
  | { name: 'enroll'; factorId: string; qr: string; secret: string }
  | { name: 'verify'; factorId: string }
  | { name: 'notStaff' }
  | { name: 'ready'; session: Session; displayName: string; isAdmin: boolean }

export default function AdminApp() {
  const [phase, setPhase] = useState<Phase>({ name: 'loading' })
  const [error, setError] = useState<string | null>(null)

  /** Decide what the signed-in person must do next: sign in, set up MFA, verify MFA, or use the screen. */
  const resolve = useCallback(async () => {
    setError(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) return setPhase({ name: 'signedOut' })

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verified = factors?.totp.find(f => f.status === 'verified')
      if (verified) return setPhase({ name: 'verify', factorId: verified.id })

      // Remove half-finished enrollments, then start a new one.
      for (const f of factors?.all ?? []) {
        if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `shoko.dev ${new Date().toISOString().slice(0, 10)}`,
      })
      if (enrollError || !enrolled) {
        setError('二段階認証の設定を開始できませんでした。')
        return setPhase({ name: 'signedOut' })
      }
      return setPhase({ name: 'enroll', factorId: enrolled.id, qr: enrolled.totp.qr_code, secret: enrolled.totp.secret })
    }

    const { data: staff } = await supabase.from('staff').select('display_name, role').eq('user_id', session.user.id).maybeSingle()
    if (!staff) return setPhase({ name: 'notStaff' })
    setPhase({ name: 'ready', session, displayName: staff.display_name, isAdmin: staff.role === 'admin' })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    resolve()
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') setPhase({ name: 'signedOut' })
    })
    return () => data.subscription.unsubscribe()
  }, [resolve])

  const signOut = async () => {
    await supabase.auth.signOut()
    setPhase({ name: 'signedOut' })
  }

  if (!supabaseConfigured) {
    return (
      <AdminFrame>
        <p className="admin-error">この環境では審査画面の設定が完了していません。</p>
      </AdminFrame>
    )
  }

  switch (phase.name) {
    case 'loading':
      return <AdminFrame><p aria-live="polite">読み込み中…</p></AdminFrame>
    case 'signedOut':
      return <SignIn onDone={resolve} initialError={error} />
    case 'enroll':
    case 'verify':
      return <Mfa phase={phase} onDone={resolve} onCancel={signOut} />
    case 'notStaff':
      return (
        <AdminFrame>
          <p className="admin-error">このアカウントには審査画面を使う権限がありません。</p>
          <button className="btn btn--secondary" onClick={signOut}>ログアウト</button>
        </AdminFrame>
      )
    case 'ready':
      return <AdminShell displayName={phase.displayName} isAdmin={phase.isAdmin} onSignOut={signOut} />
  }
}

function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <main className="admin-auth">
      <div className="admin-auth__card">
        <p className="admin-auth__brand">さとうしょうこ｜審査画面</p>
        {children}
      </div>
    </main>
  )
}

function SignIn({ onDone, initialError }: { onDone: () => void; initialError: string | null }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) return setError('メールアドレスまたはパスワードが正しくありません。')
    onDone()
  }

  return (
    <AdminFrame>
      <h1 className="admin-auth__title">ログイン</h1>
      <form onSubmit={submit} className="admin-form">
        <label htmlFor="admin-email">メールアドレス</label>
        <input id="admin-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        <label htmlFor="admin-password">パスワード</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? '確認しています…' : 'ログイン'}
        </button>
      </form>
    </AdminFrame>
  )
}

function Mfa({
  phase,
  onDone,
  onCancel,
}: {
  phase: Extract<Phase, { name: 'enroll' | 'verify' }>
  onDone: () => void
  onCancel: () => void
}) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: phase.factorId, code: code.trim() })
    setBusy(false)
    if (error) return setError('確認コードが正しくないか、期限が切れています。アプリに表示されている最新のコードを入力してください。')
    onDone()
  }

  return (
    <AdminFrame>
      <h1 className="admin-auth__title">二段階認証</h1>
      {phase.name === 'enroll' ? (
        <>
          <p>
            初回のみ設定が必要です。認証アプリ（Google Authenticator、1Password など）で下の QR コードを読み取り、表示された6桁のコードを入力してください。
          </p>
          <img className="admin-qr" src={phase.qr} alt="二段階認証の設定用 QR コード" width={200} height={200} />
          <p className="admin-muted">
            QR コードを読み取れない場合は、次のキーを手入力してください：<code className="admin-secret">{phase.secret}</code>
          </p>
        </>
      ) : (
        <p>認証アプリに表示されている6桁のコードを入力してください。</p>
      )}
      <form onSubmit={submit} className="admin-form">
        <label htmlFor="admin-code">確認コード</label>
        <input
          id="admin-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          required
        />
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={busy || code.length !== 6}>
          {busy ? '確認しています…' : '確認する'}
        </button>
        <button className="admin-link" type="button" onClick={onCancel}>
          ログアウト
        </button>
      </form>
    </AdminFrame>
  )
}

function AdminShell({ displayName, isAdmin, onSignOut }: { displayName: string; isAdmin: boolean; onSignOut: () => void }) {
  const [view, setView] = useState<'voices' | 'issues' | 'volunteers' | 'events'>('voices')
  const [pendingSource, setPendingSource] = useState<PendingSource | null>(null)
  return (
    <div className="admin">
      <header className="admin-header">
        <p className="admin-header__title">審査画面</p>
        <nav className="admin-views" aria-label="表示する情報">
          <button className={`admin-view${view === 'voices' ? ' is-active' : ''}`} aria-pressed={view === 'voices'} onClick={() => setView('voices')}>
            困りごと・ご意見
          </button>
          <button className={`admin-view${view === 'issues' ? ' is-active' : ''}`} aria-pressed={view === 'issues'} onClick={() => setView('issues')}>
            課題（公開）
          </button>
          <button
            className={`admin-view${view === 'volunteers' ? ' is-active' : ''}`}
            aria-pressed={view === 'volunteers'}
            onClick={() => setView('volunteers')}
          >
            ボランティア（後援会）
          </button>
          <button className={`admin-view${view === 'events' ? ' is-active' : ''}`} aria-pressed={view === 'events'} onClick={() => setView('events')}>
            活動予定
          </button>
        </nav>
        <div className="admin-header__user">
          <span>{displayName}</span>
          <button className="admin-link admin-link--light" onClick={onSignOut}>
            ログアウト
          </button>
        </div>
      </header>
      {view === 'voices' && (
        <Dashboard
          onCreateIssue={source => {
            setPendingSource(source)
            setView('issues')
          }}
        />
      )}
      {view === 'issues' && (
        <IssuesDashboard isAdmin={isAdmin} pendingSource={pendingSource} onPendingUsed={() => setPendingSource(null)} />
      )}
      {view === 'volunteers' && <VolunteerDashboard />}
      {view === 'events' && <EventsAdmin isAdmin={isAdmin} />}
    </div>
  )
}
