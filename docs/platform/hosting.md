# ホスティング構成の比較と推奨（GitHub Pages 継続 vs Vercel 移行）

作成日: 2026-11-20
前提: Supabase（東京リージョン）を DB・認証に採用する。既存の React + TypeScript + Vite、デザイン、コンテンツを維持する。shoko.dev を使い続ける。Next.js への全面移行はしない。
関連: [plan.md](./plan.md)（機能・データモデル・MVP）

> **料金について:** 料金は 2026年11月時点で把握している公開価格に基づく目安です。契約前に、各社の料金ページで最新の価格と利用規約を必ず確認してください。

---

## 1. 結論

**Vercel に移行することを推奨します（Vite のまま。Next.js は使わない）。**

- 公開サイトは今の Vite ビルドをそのまま Vercel で配信する。サーバー側の処理は、同じリポジトリの `api/` ディレクトリに置く **Vercel Functions（Node.js、東京リージョン `hnd1`）** で実装する。
- 環境を3つに分ける。**ローカル（Supabase CLI）／プレビュー（Vercel Preview → Supabase staging）／本番（Vercel Production → Supabase prod）**。
- 既存のハッシュ URL（`#/policy/education` など）は、**ページを開いたときにブラウザ側で新しいパス形式の URL（`/policy/education`）に置き換える**。古いリンクも引き続き使える。
- 移行作業は2段階に分ける。
  1. **M-1:** 両方のホスティングで同じように動く設定だけを追加する（このブランチで実施済み）。
  2. **DNS 切り替え（事前に確認をいただく）**
  3. **M-2:** パス形式の URL に移行する。

  この順番は守る必要があります。M-2 を DNS 切り替えより前に本番に入れると、GitHub Pages では新しい URL を再読み込みしたときに 404 になります。
- 費用の目安は **月 $45 前後**（Vercel Pro $20 ＋ Supabase Pro $25）。Vercel の無料プラン（Hobby）は**非商用の個人利用に限られる**ため、後援会のサイトで使えるかは規約の確認が必要です（§6）。

---

## 2. フェーズA〜C（MVP）での比較

| 観点 | GitHub Pages 継続案 | **Vercel 移行案（推奨）** |
|---|---|---|
| 公開サイトの配信 | 今のまま | Vite のビルド結果をそのまま配信。コードの変更はほぼ不要 |
| サーバー側 API（投稿の受付など） | Supabase Edge Functions（Deno）。サイトとは別に `supabase functions deploy` が必要 | **Vercel Functions（Node.js/TS）**。同じリポジトリに置き、`git push` で一緒にデプロイされる |
| デプロイの流れ | GitHub Actions（サイト）＋ Supabase CLI（API）の2系統 | **1系統**（GitHub と連携し、push するだけ） |
| プレビュー環境 | なし（本番1つだけ） | **PR やブランチごとにプレビュー URL が作られる**。保護をかけて関係者だけが見られる |
| 環境変数の分離 | GitHub Secrets と Supabase Secrets の2か所 | **Vercel で Development／Preview／Production ごとに値を分けられる** |
| URL | ハッシュ形式のまま（`#/issues/12`） | パス形式（`/issues/12`）。ハッシュ形式からは自動で置き換える |
| 検索エンジン・SNS のプレビュー（OGP） | ページごとに設定できない | ページごとの HTML をビルド時に生成できる（政策ページなど） |
| セキュリティヘッダー（CSP、HSTS、X-Frame-Options など） | **設定できない**（`<meta>` で一部だけ） | `vercel.json` で設定できる。審査画面だけ厳しくすることもできる |
| 審査画面 `/admin` の保護 | 公開ページと同じ扱い | `noindex`・キャッシュ禁止・GA なしをパス単位で設定できる |
| 関数の場所 | Supabase と同じ東京 | `hnd1`（東京）に固定し、Supabase の近くに置ける |
| ロックイン | 少ない | 少ない（Vite のままなので、他のホスティングにも移しやすい） |
| 費用（§6） | 約 $25/月（Supabase Pro のみ） | 約 $45/月（Vercel Pro を含む） |
| 移行の手間 | なし | DNS 切り替えと URL の移行（§5） |

**判断:** 市民の個人情報を扱う以上、**プレビュー環境・環境ごとの秘密鍵の分離・セキュリティヘッダー**は必要な機能だと考えます。GitHub Pages ではこの3つを満たせません。月 $20 ほどの差額は、運用の安全性とデプロイが1系統で済むことで十分に見合うと判断しました。

---

## 3. 推奨構成

```
                       ┌──────────── Vercel（プロジェクト1つ） ────────────┐
ブラウザ ── shoko.dev ─┤ 静的配信: Vite のビルド結果（dist/）                │
                       │   /, /policy/:slug, /issues, /voice …  → index.html │
                       │   /admin/*                            → admin.html  │
                       │ Functions（Node.js, hnd1）: api/                    │
                       │   POST /api/submit   Turnstile検証→Supabase RPC    │
                       │   （D）/api/notify/* 通知の登録・確定・停止          │
                       └──────────────────────┬─────────────────────────────┘
                                              │ 秘密鍵（サーバー側だけ）
ブラウザ（閲覧・審査画面）── 公開してよい鍵 ──▶ Supabase（ap-northeast-1）
                                                Postgres + RLS / Auth（スタッフのみ、MFA必須）
```

### 誰が何を使ってアクセスするか
| 処理 | 実行する場所 | 使う鍵 | 防御 |
|---|---|---|---|
| 公開課題を読む | ブラウザ → Supabase | publishable key（公開してよい鍵） | RLS: `status='published'` の行だけ。anon には非公開テーブルの GRANT を与えない |
| 投稿する | ブラウザ → `/api/submit` → Supabase | **secret key**（Vercel のサーバー側環境変数だけに置く） | Turnstile、入力チェック、回数制限。DB 側では `submit_voice()` という1つの関数だけを呼ぶ |
| 審査する | 審査画面 → Supabase | publishable key ＋ スタッフ本人のログイン情報 | RLS: `is_staff()` かつ二段階認証済み（`aal2`）であること。連絡先は RPC 経由で表示し、操作を記録する |
| （D）メールを送る | `/api/notify/*` → Resend | Resend API key（サーバー側だけ） | admin の承認が記録されている配信だけを送る |

secret key（RLS を無視できる鍵）は、投稿受付の関数だけで使います。審査画面では使いません。審査の権限は RLS とスタッフ本人のログインで制御します。

### 環境の分離

| 環境 | フロント | API | DB・認証 | Turnstile | 見られる人 |
|---|---|---|---|---|---|
| ローカル | `vite`（`/api` は `vercel dev` またはプロキシ） | `vercel dev` | **Supabase CLI のローカル環境**（Docker） | テスト用キー | 開発者 |
| プレビュー | ブランチ・PR ごとの Vercel Preview | 同じ | **Supabase `shoko-staging`**（ダミーデータのみ） | テスト用キー | Vercel の認証をかけ、関係者だけ |
| 本番 | `main` → shoko.dev | 同じ | **Supabase `shoko-prod`** | 本番用キー | 一般公開 |

- **本番の秘密鍵は、Vercel の Production 環境にだけ登録する**。プレビュー環境から本番 DB に接続することはできない構成にする。
- **staging には本物の投稿をコピーしない**（個人情報をコピーしないため。テストデータは `supabase/seed.sql` で用意する）。
- DB の変更（マイグレーション）は `supabase/migrations/` で管理する。staging へは PR のマージ時に適用し、**prod へは確認のうえ手動で適用する**（MVP の間）。

### 環境変数

| 変数 | 公開してよいか | Development | Preview | Production |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | 公開（ブラウザ用のコードに含まれる） | local | staging | prod |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 公開 | local | staging | prod |
| `VITE_TURNSTILE_SITE_KEY` | 公開 | テスト用 | テスト用 | 本番用 |
| `SUPABASE_SECRET_KEY` | **秘密**（Sensitive に設定） | local | staging | prod |
| `TURNSTILE_SECRET_KEY` | **秘密** | テスト用 | テスト用 | 本番用 |
| `IP_HASH_SALT` | **秘密** | 任意の値 | 環境ごとに別の値 | 環境ごとに別の値 |
| `RESEND_API_KEY`（D） | **秘密** | — | テスト用 | 本番用 |

**決まり:** `VITE_` で始まる変数は、すべてブラウザ用のコードに埋め込まれます。そのため、秘密の値を `VITE_` で始まる名前にしてはいけません。ビルド時に `VITE_*` の値が `sb_secret_` などで始まっていないかを確認するスクリプトを入れ、該当すればビルドを失敗させます。

### Supabase RLS の安全確認（チェックリスト）
- [ ] `public` スキーマの全テーブルで RLS を有効にする（CI で `pg_tables.rowsecurity = false` のテーブルが0件であることを確認）
- [ ] 非公開テーブル（submissions、submission_contacts、subscribers、audit_log など）では、`anon` と `authenticated` から **GRANT を取り消す**（RLS と GRANT の二重防御）
- [ ] 公開用のポリシーは `status = 'published'` で絞り込み、列も公開してよいものだけにする（必要ならビューを使う）
- [ ] スタッフ用のポリシーでは `is_staff()` と `auth.jwt()->>'aal' = 'aal2'`（二段階認証済み）を確認する
- [ ] `SECURITY DEFINER` の関数では `search_path` を固定し、EXECUTE 権限を必要なロールだけに与える
- [ ] Auth: **一般の新規登録を無効にする**（スタッフは招待だけ）。リダイレクト先 URL を許可リストで管理する（本番は shoko.dev だけ。staging はプレビュー用ドメイン）
- [ ] CI で RLS のテストを実行する: anon で非公開テーブルを SELECT・INSERT できないこと、二段階認証をしていないスタッフは読めないこと、などを毎回確認する
- [ ] Supabase の Security Advisor で警告が0件であることを確認する
- [ ] Vercel Functions のログに、投稿本文やメールアドレスを出力しない（エラーには受付番号だけを残す）

---

## 4. Vercel の設定（M-1 として実施済み）

`chore/vercel-migration` ブランチの `vercel.json`:
- `framework: vite`、`outputDirectory: dist`、Functions のリージョンは `hnd1`
- セキュリティヘッダー: HSTS、`X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options: DENY`、`Permissions-Policy`
- CSP は、まず **Report-Only（違反をブラウザのコンソールに表示するだけで、ブロックはしない）** で入れる。プレビュー環境で違反が出ないことを確認してから、本番で有効にする（GA・Google Fonts・note の画像を許可済み）
- `/assets/*` には長期キャッシュを設定する（Vite のファイル名にはハッシュが付くため安全）
- **書き換えルール（rewrites）はまだ入れない**。今はハッシュ URL なので必要がなく、GitHub Pages と同じ挙動を保つため

GitHub Pages 用のワークフロー（`deploy.yml`）と `public/CNAME` は、**DNS を切り替えて Vercel の安定稼働を確認するまで残します**（切り戻しのため）。

---

## 5. 移行手順（URL を壊さない方法）

### 現在の DNS（2026-11-20 に確認）
- `shoko.dev` の A レコードは GitHub Pages（185.199.108〜111.153）、`www` は `shoco310.github.io` への CNAME
- ネームサーバーは `ns-cloud-e*.googledomains.com`（旧 Google Domains。現在は Squarespace などで管理されている可能性があるので、管理画面の場所を確認してください）
- MX・TXT レコードはない（メール通知の準備（フェーズD）では、送信ドメインを認証するための SPF/DKIM/DMARC レコードを追加します）

### 手順
| # | 作業 | 担当 | 本番への影響 |
|---|---|---|---|
| 1 | Vercel のチームを作成し、GitHub リポジトリを取り込む（Framework は Vite を選択） | **ご本人**（アカウント操作） | なし。`*.vercel.app` に公開される |
| 2 | Deployment Protection（Vercel の認証）を有効にする | ご本人 | なし |
| 3 | `chore/vercel-migration` のプレビューで、表示・ヘッダー・CSP の違反ログを確認する | 開発 | なし |
| 4 | Vercel の Domains に `shoko.dev` と `www.shoko.dev` を追加する（この時点では DNS は変えない。Vercel が必要なレコードを表示する） | ご本人 | なし |
| 5 | DNS の TTL を短くする（例：300秒）。1日待つ | ご本人 | なし |
| 6 | **（事前に確認をいただいてから）** A レコードと `www` の CNAME を、Vercel が表示した値に変える | **ご本人の承認が必要** | **本番が切り替わる** |
| 7 | HTTPS 証明書の発行、表示、既存のハッシュ URL、SNS のシェア表示を確認する | 開発 | — |
| 8 | 1〜2週間、安定して動いていることを確認したら、`deploy.yml` を止めて `public/CNAME` を削除し、GitHub Pages を無効にする | 開発（確認のうえ） | なし |
| 9 | **M-2: パス形式の URL に移行する**（下記） | 開発 | ハッシュ URL は自動で置き換わる |

**切り戻し:** 手順6のあと問題が起きたら、DNS を GitHub Pages の値（A: 185.199.108.153 / .109 / .110 / .111、www: `shoco310.github.io`）に戻します。手順8までは GitHub Pages 側もそのまま動かしておきます。

### M-2: ハッシュ URL からパス形式の URL へ
- ブラウザはハッシュ（`#` 以降）をサーバーに送らないため、**置き換えはブラウザ側で行います**。ページを開いたときに `#/policy/education` を検出したら、`history.replaceState` で `/policy/education` に置き換えて表示します（ページの再読み込みは起きず、履歴にも余計な項目が残りません）。
- `#message` などのページ内アンカーは、今まで通りアンカーとして扱います（`#/` で始まるものだけを置き換えます）。
- `vercel.json` の書き換えルールは、**実在するルートだけ**を列挙します（`/policy/:slug`、`/issues`、`/issues/:id`、`/voice`、`/data` など）。すべてを `index.html` に流すと、存在しない URL でも200を返す「ソフト404」になるため、それ以外は 404 にします。
- ビルド時に、政策ページなどの HTML（タイトル・説明・OGP）を個別に生成し、SNS でシェアしたときに正しいプレビューが出るようにします。
- 修正が必要な既存コード: [Greeting.tsx:148](../../src/components/Greeting.tsx#L148) の `<img src="images/more-challenge.png">` が相対パスになっています。パス形式の URL では画像が壊れるので、`/images/…` に直し、あわせて `alt` を追加します。

---

## 6. 費用と運用負担の比較（月額の目安）

| 構成 | 費用 | 運用負担 | 備考 |
|---|---|---|---|
| GitHub Pages ＋ Supabase Pro | 約 $25 | 中（デプロイが2系統。プレビューなし） | ヘッダーを設定できない |
| Vercel Hobby ＋ Supabase Pro | 約 $25 | 小 | **Hobby は非商用の個人利用に限られる。** 後援会のサイトで使えるかは規約の確認が必要。チームメンバーを追加できない |
| **Vercel Pro（1人）＋ Supabase Pro** | **約 $45（約7,000円）** | **小** | 推奨。メンバーを追加すると1人あたり $20 ずつ増える |

- **Supabase staging:** 同じ組織に作ると、プロジェクトの追加料金がかかります（Compute 代として月 $10 程度）。**別の Free 組織に staging を置けば $0** です（7日間使わないと一時停止しますが、staging なら問題ありません）。
- **Vercel の従量課金:** このサイトの規模（静的配信が中心で、関数は投稿のときだけ動く）なら、Pro に含まれる枠を超える見込みはありません。念のため Spend Management で上限を設定します。
- **Turnstile:** 無料。**Resend（D）:** 送信が月数千通までなら無料枠の範囲。
- **運用作業:** 依存パッケージの更新（Dependabot で月1回程度）、Supabase のバックアップ確認（Pro は毎日自動でバックアップ）、Security Advisor の確認（月1回）、保存期限を過ぎた連絡先の削除ジョブの監視。

---

## 7. 作業とコミットの分け方

| トラック | ブランチ | 内容 |
|---|---|---|
| ホスティング移行 | `chore/vercel-migration` | M-1（`vercel.json`、`.gitignore`、追跡不要ファイルの整理）→ DNS 切り替え → GitHub Pages の停止 → M-2（パス形式の URL） |
| 市民参加機能 | `feature/platform-phase-a` 以降 | plan.md のフェーズA〜C。**M-1 を main にマージしてから**始める（プレビュー環境を使うため）。パスに依存する機能は M-2 の後に回す |

---

## 8. 決めていただきたいこと

1. Vercel のプラン（Pro を推奨。Hobby を使う場合は規約を確認する）と、チームの名前
2. Supabase の組織の分け方（prod は Pro、staging は別の Free 組織にする案）
3. DNS の管理画面がどこにあるか（Squarespace か Google Cloud DNS か）と、DNS を切り替える日時
4. `www.shoko.dev` と `shoko.dev` のどちらを正式な URL にするか（推奨: `shoko.dev` にして、`www` からはリダイレクトする）
