/**
 * Whether a related municipal system/program was confirmed for this ACTION
 * item — NOT a statement of policy approach:
 * - 'existing'     : a related existing system/program was confirmed against
 *                    a primary source (statusNote names it). The badge this
 *                    produces ("関連する既存制度あり") only says that system
 *                    exists and relates to this item — it does not promise
 *                    that the item means expanding it, coordinating it with
 *                    others, or building something new alongside it. Which
 *                    of those this initiative actually pursues is an
 *                    unmade policy decision, not implied by this flag.
 * - 'unconfirmed'  : whether a related existing system exists has not been
 *                    fully investigated — NOT the same as "no existing
 *                    system" or "new system". No badge is shown; never
 *                    render this as "新規制度" or "制度なし".
 */
export type ActionStatus = 'existing' | 'unconfirmed'

export interface PolicyInitiative {
  title: string
  desc: string
  status: ActionStatus
  /** Named related program(s)/system(s), shown only when status === 'existing' */
  statusNote?: string
  /** Official page for the program named in statusNote — only when a single, verified match exists */
  statusUrl?: string
}

export interface DataBreakdown {
  label: string
  value: string
  /** 0-100. Only set when this row is safe to visualize as a simple bar (see DataPoint.chartable). */
  barPct?: number
}

export interface DataStat {
  /** Short qualifier for this specific number (e.g. "小学校", "令和8年度採択件数") */
  label: string
  /** The number itself, exactly as confirmed against the primary source */
  value: string
  /**
   * 0-100. Only set when this stat is a percentage on a confirmed, stated
   * base that is safe to show as a bar alongside the other `stats` entries
   * of the same DataPoint (i.e. they all answer the same question).
   */
  barPct?: number
}

export interface DataPoint {
  label: string
  /**
   * The primary hero number(s) for this card, rendered large and in pink.
   * Use more than one entry only when the numbers share the same
   * question/context and are being intentionally grouped (e.g. a funnel, or
   * a 小学校／中学校 split of the same measure) — never group numbers from
   * different questions or denominators here.
   */
  stats?: DataStat[]
  /** Fallback single hero value/phrase when `stats` isn't used. */
  value: string
  /**
   * True when `value` is a qualitative finding (e.g. "most common answer"),
   * not a number — rendered as a bold highlighted statement rather than a
   * giant hero figure.
   */
  highlight?: boolean
  /** Short, already-confirmed plain-language explanation of what the number means. */
  description?: string
  /** 調査年・対象（例："令和6年7月／市内高校生"） */
  survey: string
  /** 出典表記（例："宇部市人口ビジョン【改訂版】p.31"） */
  source: string
  sourceUrl?: string
  breakdown?: DataBreakdown[]
  /**
   * Only true when every breakdown row answers the same question with a
   * confirmed, shared base — safe to render as comparable bars. Rows from
   * different questions or denominators must NOT be charted together.
   */
  chartable?: boolean
  /** Extra caveat shown directly under this one card */
  note?: string
}

export interface VoiceQuote {
  quote: string
  context: string
  response?: string
  responseLabel?: string
}

export interface PolicyIssues {
  confirmed: string[]
  considerations: string[]
  analysisGaps: string[]
}

export interface SourceItem {
  label: string
  url?: string
  type: 'primary' | 'report' | 'reference'
}

export interface Policy {
  slug: string
  number: string
  emoji: string
  name: string
  tagline: string
  image: string
  /** Short summary shown on the top-page card — unchanged since Ver.1 */
  summary: string
  background: string[]
  initiatives: PolicyInitiative[]
  challenges: string[]
  existingSystems: string[]
  /** DATA section — confirmed statistics only */
  dataPoints?: DataPoint[]
  dataNote?: string
  /** VOICE section — omitted entirely when empty (no individually-attributable opinion found) */
  voice?: VoiceQuote[]
  /** Evidence-labeled findings shown alongside (not replacing) the existing challenges/existingSystems prose */
  issuesEvidence?: PolicyIssues
  sourceList?: SourceItem[]
}

export const policies: Policy[] = [
  {
    slug: 'education',
    number: '01',
    emoji: '📚',
    name: '教育・人材育成',
    tagline: '子どもから大人まで、学び続けられる宇部へ。',
    image: '/images/policy-education.jpg',
    summary:
      '子どもたちが自分の可能性を広げられる学びの環境づくりを進めます。デジタル教育の充実と、年代を問わずリスキリングができる機会を増やします。',
    background: [
      '宇部で生まれ育った子どもたちが、自分の可能性を信じて挑戦できるように。そして大人になってからも、学び直したいと思ったときにいつでも学べるように。教育・人材育成は、年齢に関係なく「挑戦できるまち」の土台になる分野だと考えています。',
      'IT業界でエンジニアとして働き、多くの人が新しいスキルを身につけて一歩を踏み出す瞬間を見てきた経験から、学びの機会をどう増やしていくかを考えていきます。',
    ],
    initiatives: [
      {
        title: 'IT・AI教育とプログラミング体験',
        desc: '子どもたちが早い段階でIT・AI技術に触れ、楽しみながら学べる機会を増やします。プログラミング体験の場を学校内外につくることを目指します。',
        status: 'unconfirmed',
      },
      {
        title: '家庭環境や地域による体験格差への対応',
        desc: '家庭の経済状況や住んでいる地域によって、学びや体験の機会に差が生まれないよう、公的な学びの場や支援の充実を検討します。',
        status: 'unconfirmed',
      },
      {
        title: '不登校の子どもの多様な学びの場',
        desc: '学校に通うことが難しい子どもたちにも、それぞれのペースで学び続けられる多様な居場所・学びの選択肢を増やしていきます。',
        status: 'existing',
        statusNote: '校内ふれあい教室（全12中学校）、フリースクール等利用支援補助金、訪問型家庭教育支援事業',
      },
      {
        title: '地元企業・大学と連携したキャリア教育',
        desc: '地元の企業や大学と連携し、子どもたちが宇部で働く・挑戦する未来を具体的にイメージできるキャリア教育の機会をつくります。',
        status: 'unconfirmed',
      },
      {
        title: '社会人・シニアの生涯学習',
        desc: '子育てや仕事をしながらでも、また年齢を重ねてからでも学び直せるよう、社会人・シニア向けの学びの場やリスキリングの機会を広げます。',
        status: 'existing',
        statusNote: 'うべシニア大学',
      },
    ],
    challenges: [
      '多くの地方都市と同様に、宇部でも若い世代の流出や人口減少が課題となっています。学びや挑戦の機会が都市部に偏りやすく、「やりたいことがあれば都市部へ」という考え方が当たり前になりつつあることも、その一因だと感じています。',
      'また、家庭環境や地域によって、子どもたちが得られる学びや体験の機会に差が生まれやすいという課題もあります。',
    ],
    existingSystems: [
      '宇部市にもすでに教育・子育てに関する取り組みや支援制度があります。まずはこうした既存の取り組みを丁寧に把握し、現場の声を聞きながら、より使いやすく、より多くの人に届く形に改善できないかを検討していきます。',
      '特に、情報が届きにくい・申請の手続きが分かりにくいといった「制度はあるのに使われにくい」状態を減らしていくことを重視します。',
    ],
    dataPoints: [
      {
        label: '不登校児童生徒数',
        value: '388人',
        survey: '令和5年度／市立小中学校',
        source: '宇部市こども計画（令和7年3月）p.29',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/097/ubeshikodomokeikaku.pdf',
        note: '令和元年度から増加傾向にあり、令和5年度は過去最高の人数',
      },
      {
        label: '就学援助認定率',
        value: '',
        stats: [
          { label: '小学校', value: '17.84%', barPct: 17.84 },
          { label: '中学校', value: '19.75%', barPct: 19.75 },
        ],
        survey: '令和5年／市立小中学校の児童生徒',
        source: '宇部市こども計画（令和7年3月）p.22',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/097/ubeshikodomokeikaku.pdf',
        breakdown: [
          { label: '小学校 認定者数（児童数に対する率）', value: '1,376人' },
          { label: '中学校 認定者数（生徒数に対する率）', value: '801人' },
        ],
        note: '就学援助を受けている児童生徒の認定率です。体験・学習機会の格差そのものを直接測定した数値ではありません。',
      },
      {
        label: 'うべシニア大学 修了者数',
        value: '',
        stats: [
          { label: '令和5年度実績（見込）', value: '35人' },
          { label: '令和8年度目標（値）', value: '40人' },
        ],
        survey: '第9期宇部市高齢者福祉計画',
        source: '第9期宇部市高齢者福祉計画【概要版】（令和6年3月）',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/005/423/9gaiyou.pdf',
        note: '実績（見込）と目標は年度が異なります。混同しないでください。',
      },
    ],
    issuesEvidence: {
      confirmed: [
        '不登校児童生徒数は令和元年度から増加傾向にあり、令和5年度は過去最高の388人となっている。',
        '就学援助認定率は小学校17.84%・中学校19.75%である（児童生徒に占める認定者の割合）。',
      ],
      considerations: [
        '不登校支援（校内ふれあい教室）は中学校を中心に整備されており、小学校への展開は今後の課題である可能性がある（出典：地元紙報道）。',
      ],
      analysisGaps: [
        'IT・AI教育の実施状況、家庭環境による体験格差の当事者調査、地元企業・大学とのキャリア教育連携の実績については、今回確認できる資料がなく分析していない。',
      ],
    },
    sourceList: [
      { label: '宇部市こども計画（令和7年3月）', url: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/097/ubeshikodomokeikaku.pdf', type: 'primary' },
      { label: '第9期宇部市高齢者福祉計画【概要版】（令和6年3月）', url: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/005/423/9gaiyou.pdf', type: 'primary' },
      { label: '不登校、コロナ禍に急増 市教委「校内ふれあい教室」を拡充【宇部】｜宇部日報デジタルSARATTO', url: 'https://ubenippo.co.jp/2024/03/01/3327969/', type: 'report' },
    ],
  },
  {
    slug: 'work',
    number: '02',
    emoji: '💼',
    name: '仕事・産業振興',
    tagline: '何歳からでも、新しい挑戦ができる宇部へ。',
    image: '/images/policy-work.jpg',
    summary:
      '地域産業と新しい働き方をつなぎ、宇部で挑戦できる仕事を増やします。スタートアップ支援と副業・テレワーク環境の整備に取り組みます。',
    background: [
      '「やりたい仕事がないから都市部へ」ではなく、「宇部にいながら挑戦できる」を当たり前にしたい。エンジニアとして働き、起業も経験した中で、地域産業とテクノロジー、新しい働き方をどうつなげるかを考え続けてきました。',
      '年齢や経歴に関わらず、何度でも新しい挑戦ができる仕事・産業のあり方を、宇部から広げていきたいと考えています。',
    ],
    initiatives: [
      {
        title: '地元中小企業のDX・AI活用',
        desc: '地元の中小企業がデジタル技術やAIを取り入れやすくなるよう、情報提供や相談の機会を増やし、生産性向上や新しい挑戦を後押しします。',
        status: 'existing',
        statusNote: '宇部市中小企業等DX推進事業費補助金',
        statusUrl: 'https://www.city.ube.yamaguchi.jp/shisei/hojyojyosei/1010994/1028886.html',
      },
      {
        title: 'リモートワーク、副業、短時間勤務の普及',
        desc: '子育てや介護、体調などの事情があっても働き続けられるよう、リモートワークや副業、短時間勤務など多様な働き方が広がる環境づくりを進めます。',
        status: 'unconfirmed',
      },
      {
        title: '定年後の再就職やシニアの就業機会',
        desc: '定年後も働きたい、社会とつながっていたいという方が、経験や技術を活かして再び活躍できる機会を増やします。',
        status: 'existing',
        statusNote: '宇部市シルバー人材センター',
        statusUrl: 'https://webc.sjc.ne.jp/ubesc/index',
      },
      {
        title: '年齢を問わないリスキリング',
        desc: '何歳からでも新しいスキルを学び直せるよう、社会人向けのリスキリング(学び直し)の機会を、企業・教育機関と連携しながら広げます。',
        status: 'unconfirmed',
      },
      {
        title: '起業支援と地域企業の事業承継',
        desc: 'これから挑戦する人への起業支援と、後継者不足に悩む地域企業の事業承継、両方の課題に向き合う仕組みづくりを検討します。',
        status: 'unconfirmed',
      },
    ],
    challenges: [
      '宇部を含む多くの地方都市で、若者や働く世代の流出、後継者不足による事業承継の課題が指摘されています。「挑戦したい仕事が地元にない」と感じて地域を離れる選択をする人も少なくありません。',
      '一方で、リモートワークや副業など、場所を選ばない働き方が広がりつつある今だからこそ、宇部にいながら挑戦できる環境をつくれる可能性があると考えています。',
    ],
    existingSystems: [
      '創業支援や中小企業支援など、宇部市にもすでに関連する制度があります。まずはそれらの制度がどれだけ知られ、活用されているかを確認し、利用者目線で分かりやすく届く形に改善できないかを検討していきます。',
    ],
    dataPoints: [
      {
        label: '高校生の進学・進学先希望',
        value: '',
        stats: [
          { label: '回答者のうち進学を希望する割合', value: '8割' },
          { label: 'そのうち市外への進学希望', value: '7割超' },
        ],
        description: '進学希望者の多くが、市外への進学を希望している。',
        survey: '令和6年7月／市内高校生',
        source: '宇部市人口ビジョン【改訂版】p.31',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
        note: '「7割超」は全回答者ではなく、進学希望者（回答者の8割）のうちの割合です。異なる母数のため、この2つを同じグラフでは示していません。',
      },
      {
        label: '宇部市を選ばない理由（高校生・大学生共通）',
        value: '「希望する就職先がないから」が最多',
        highlight: true,
        survey: '令和6年7月／市内高校生・大学生等',
        source: '宇部市人口ビジョン【改訂版】p.33, 42-43',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
      },
      {
        label: '市内企業の正社員不足感',
        value: '',
        stats: [{ label: '正社員が「不足」＋「やや不足」', value: '6割超' }],
        survey: '令和6年7月／市内立地企業（n=223）',
        source: '宇部市人口ビジョン【改訂版】p.46',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
      },
      {
        label: '中小企業等DX推進事業費補助金',
        value: '',
        stats: [{ label: '令和8年度採択件数', value: '5者' }],
        description: '補助率2/3・上限100万円（募集は終了）',
        survey: '令和8年度（募集は終了）',
        source: '宇部市公式ウェブサイト（2026年8月26日更新）',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/shisei/hojyojyosei/1010994/1028886.html',
        note: '原文：「審査を行った結果、5者を補助対象事業者として採択しました」',
      },
      {
        label: '企業の働き方に関する取組（3つの異なる設問）',
        value: '',
        stats: [
          { label: '女性社員活躍推進：勤務形態の多様化(テレワーク等)', value: '3割超' },
          { label: 'ワークライフバランス推進：有給休暇の取得促進', value: '約7割' },
          { label: '子育て支援：短時間勤務制度', value: '約5割' },
        ],
        survey: '令和6年7月／市内立地企業',
        source: '宇部市人口ビジョン【改訂版】p.51-52',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
        note: '3つは選択肢構成が異なる別々の設問です。パーセンテージを横並びで比較しないでください（グラフ化していません）。',
      },
    ],
    issuesEvidence: {
      confirmed: [
        '若者（高校生・大学生）が宇部市を就職先に選ばない最大の理由は「希望する就職先がないから」である（別々の設問への回答）。',
        '市内企業の6割超が正社員「不足」「やや不足」と回答している（別の設問への回答）。',
      ],
      considerations: [
        '両者は同じ調査の異なる設問への回答であり、求職者が希望する職種・待遇と、企業が募集する職種・待遇を直接突き合わせたものではない。',
      ],
      analysisGaps: [
        '職種・待遇（給与水準）・勤務地等を対応させた分析は実施していない。そのため、両者を「需給のミスマッチ」と断定することはできない。',
      ],
    },
    sourceList: [
      { label: '宇部市人口ビジョン【改訂版】（令和7年3月）', url: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf', type: 'primary' },
      { label: '令和8年度 宇部市中小企業等DX推進事業費補助金｜宇部市公式ウェブサイト', url: 'https://www.city.ube.yamaguchi.jp/shisei/hojyojyosei/1010994/1028886.html', type: 'primary' },
      { label: '中小企業DX支援――北九州市DX推進ラボ', url: 'https://local-iot-lab.ipa.go.jp/lab/editor/article/2024040900800.html', type: 'reference' },
    ],
  },
  {
    slug: 'childcare',
    number: '03',
    emoji: '🌱',
    name: '女性・少子化・子育て支援',
    tagline: '希望するライフプランを実現できる宇部へ。',
    image: '/images/policy-childcare.jpg',
    summary:
      '子育て、仕事、暮らしを一人で抱え込まない地域づくりを目指します。保育環境の充実と、ライフステージを問わず活躍できる仕組みをつくります。',
    background: [
      '仕事と子育てを両立しながら、悩み、迷い、それでも一歩ずつ進んできた経験があります。だからこそ、「結婚したい」「子どもを持ちたい」「仕事も続けたい」といった一人ひとりの希望が、我慢せずに実現できる宇部にしたいと考えています。',
      '少子化は宇部だけの課題ではありませんが、地域として何ができるかを、当事者の声に耳を傾けながら考えていきます。',
    ],
    initiatives: [
      {
        title: '希望する結婚・出産・子ども数の実現に向けた支援',
        desc: '結婚、出産、子どもの人数について、一人ひとりが希望する形を実現しやすくなるよう、経済的・心理的なハードルを下げる支援のあり方を検討します。',
        status: 'unconfirmed',
      },
      {
        title: '病児保育、一時預かり、放課後の居場所',
        desc: '子どもが体調を崩したときや急な用事のときも安心して頼れる病児保育・一時預かりや、放課後に子どもが安心して過ごせる居場所を増やします。',
        status: 'existing',
        statusNote: '病児保育（すくすくハウス）、幼稚園一時預かり推進事業',
      },
      {
        title: '出産・育児後の再就職と学び直し',
        desc: '出産や育児でキャリアを離れた後も、無理なく再就職や学び直しができるよう、伴走型の支援を充実させます。',
        status: 'unconfirmed',
      },
      {
        title: '育児・介護と両立できる柔軟な働き方',
        desc: '育児や介護をしながらでも自分らしく働き続けられるよう、柔軟な働き方が選べる環境づくりを、企業とも連携しながら進めます。',
        status: 'unconfirmed',
      },
      {
        title: '妊娠期から子育て期までの相談・孤立防止',
        desc: '妊娠期から子育て期まで、切れ目なく相談できる体制を整え、一人で抱え込み孤立してしまう状況を防ぎます。',
        status: 'unconfirmed',
      },
    ],
    challenges: [
      '子育てや家事、仕事を一人で抱え込みやすい状況は、宇部に限らず多くの地域で共通する課題です。相談先が分かりにくい、頼れる人が近くにいないといった声も聞かれます。',
      '出産や育児をきっかけにキャリアを諦めざるを得なかったという声もあり、希望するライフプランと現実の間にギャップが生まれやすい状況があると感じています。',
    ],
    existingSystems: [
      '子育て支援や保育に関する制度は、宇部市にもすでに存在しています。まずはこれらの制度が実際に使いやすいものになっているか、当事者の声を聞きながら確認し、必要な改善を検討していきます。',
    ],
    dataPoints: [
      {
        label: '子どもを持ちたい意向',
        value: '6割',
        survey: '令和6年7〜8月／15〜39歳市民',
        source: '宇部市人口ビジョン【改訂版】p.56',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
        note: '「既にこどもがいる場合も含む」という設問での回答です（すでに子どものいる人も含んだ数値）。',
      },
      {
        label: '子どもを持ちたいと思わない理由',
        value: '',
        stats: [
          { label: '育児の心理的・肉体的負担が増えるから', value: '6割台半ば', barPct: 65 },
          { label: '子育てや教育にお金がかかるから', value: '5割', barPct: 50 },
        ],
        survey: '同上（単一設問・複数回答）',
        source: '宇部市人口ビジョン【改訂版】p.56',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
      },
      {
        label: '合計特殊出生率',
        value: '1.43',
        survey: '令和5年（2023年）／宇部市',
        source: '宇部市人口ビジョン【改訂版】p.9',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf',
        note: '平成25年（2013年）の1.57をピークに低下。人口維持水準の目安は2.07。',
      },
      {
        label: '学童保育クラブ利用者アンケート',
        value: '',
        stats: [
          { label: '設問10「総合的な満足度」（満足＋やや満足）', value: '74%' },
          { label: '設問12「クラブは楽しいか」（児童本人の回答）', value: '77%' },
        ],
        survey: '令和6年度／市内30クラブ・回答1,116件（回答率47.1%）',
        source: '学童保育クラブ利用者アンケート結果（全体集計）',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/525/2024-zenntai.pdf',
        note: '設問10（保護者経由の総合的な満足度）と設問12（児童本人の回答）は別の設問です。回答者数はいずれも1,116人（未回答0件）で、同じグラフでは比較していません。',
      },
    ],
    issuesEvidence: {
      confirmed: [
        '15〜39歳市民の6割が「子どもを持ちたい」と考えている（既に子どもがいる回答者を含む）。「持ちたいと思わない」理由では心理的・肉体的負担、経済的負担が上位を占める。',
        '学童保育クラブの利用者アンケート（回答1,116人）では、総合的な満足度（満足＋やや満足）が74%だった。',
      ],
      considerations: [
        '負担感（心理的・経済的）の軽減が、子どもを持つ意向の実現を後押しする可能性がある。',
      ],
      analysisGaps: [
        '待機児童数は定義・実数とも今回確認できておらず掲載していない。ひとり親家庭のデータ、各種施策の費用対効果についても分析していない。',
      ],
    },
    sourceList: [
      { label: '宇部市人口ビジョン【改訂版】（令和7年3月）', url: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf', type: 'primary' },
      { label: '令和6年度学童保育クラブ利用者アンケート結果（全体集計）', url: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/525/2024-zenntai.pdf', type: 'primary' },
      { label: '宇部市こども計画（令和7年3月）', url: 'https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/097/ubeshikodomokeikaku.pdf', type: 'primary' },
    ],
  },
  {
    slug: 'civic',
    number: '04',
    emoji: '🏛️',
    name: '市民参加・行政改革',
    tagline: '市民とともに、未来をつくる宇部へ。',
    image: '/images/policy-city.jpg',
    summary:
      '市民の声が届きやすく、わかりやすく開かれた市政を目指します。デジタル化による行政手続きの簡素化と、若者が参加しやすい仕組みを推進します。',
    background: [
      '行政が一方的に決めるのではなく、市民一人ひとりの声が届き、まちづくりに反映されていく。そんな開かれた市政を目指したいと考えています。',
      '技術コミュニティの運営を通じて、多様な立場の人が対話しながら物事を進めていく場づくりに携わってきた経験を、行政と市民の対話にも活かしていきたいです。',
    ],
    initiatives: [
      {
        title: '若者からシニアまで幅広い世代の市民参加',
        desc: '特定の世代や立場に偏らず、若者からシニアまで幅広い市民がまちづくりに参加しやすい仕組みや対話の場を増やします。',
        status: 'existing',
        statusNote: '若者会議、高校生議会',
      },
      {
        title: '予算、事業進捗、政策成果の可視化',
        desc: '税金がどう使われ、事業がどのように進んでいるのか、市民が確認しやすい形での情報公開・可視化を進めます。',
        status: 'existing',
        statusNote: '予算・決算の公開、議会会議録検索システム',
      },
      {
        title: '行政手続きのオンライン化とデジタル支援',
        desc: '行政手続きをオンラインで完結できる範囲を広げるとともに、デジタルが苦手な方にも寄り添った支援を併せて行います。',
        status: 'existing',
        statusNote: '宇部市DX推進計画（令和5〜8年度）、スマート申請',
      },
      {
        title: '地域の移動ニーズに応じた公共交通',
        desc: '車を運転しない・できない方も含め、地域ごとの移動ニーズに応じた公共交通のあり方を、市民や事業者と一緒に検討します。',
        status: 'existing',
        statusNote: '宇部市地域公共交通計画、デマンドバス（2018年〜）',
      },
      {
        title: '市民から寄せられた意見と対応状況の共有',
        desc: '市民から寄せられた意見や要望が、その後どのように検討・対応されたのかを分かりやすく共有する仕組みをつくります。',
        status: 'existing',
        statusNote: 'パブリックコメント制度（A〜D区分での回答を公表）',
        statusUrl: 'https://www.city.ube.yamaguchi.jp/shisei/kouhou/ikenchoushuu/1007973/index.html',
      },
    ],
    challenges: [
      '行政の取り組みや情報が市民に届きにくい、意見を伝える機会が少ないと感じている方は少なくありません。特に若い世代にとって、行政や政治が「自分とは遠いもの」になりやすいことも課題だと感じています。',
      'デジタル化が進む一方で、その恩恵を受けられる人と受けられない人の差が生まれないようにすることも重要な視点です。',
    ],
    existingSystems: [
      '広聴活動やパブリックコメントなど、市民の声を聞く仕組みは宇部市にもすでにあります。まずはこうした既存の仕組みがどれだけ知られ、活用されているかを確認し、より参加しやすい形へと改善できないかを検討していきます。',
    ],
    dataPoints: [
      {
        label: '人口ビジョン改訂パブリックコメント',
        value: '意見提出0件',
        survey: '令和6年12月〜令和7年1月',
        source: '宇部市公式ウェブサイト（パブリックコメント実施結果）',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/shisei/kouhou/ikenchoushuu/1007973/1022091/1024261.html',
      },
      {
        label: '総合戦略改訂パブリックコメント',
        value: '意見提出1件',
        survey: '同上',
        source: '宇部市公式ウェブサイト（パブリックコメント実施結果）',
        sourceUrl: 'https://www.city.ube.yamaguchi.jp/shisei/kouhou/ikenchoushuu/1007973/1022091/1024261.html',
      },
    ],
    dataNote:
      'この数値は確認した2つの案件の実績です。宇部市のパブリックコメント制度全体や、市民参加の取り組み全体を評価するものではありません。',
    voice: [
      {
        quote:
          '宇部市専用の通貨を作ってはどうでしょうか？　条件はいろいろ必要でしょうが、多くの市民に毎月付与される。当然市内での経済活動でのみ使用可能とし、そのことによって市民になることへのインセンティブにもなるし、市外への人口流出をも防ぐ。財源については、様々な補助金の分をまとめてこの「宇部市専用通貨」に費やす、というのはどうでしょうか？',
        context: '第2期宇部市まち・ひと・しごと創生総合戦略（改訂素案）へのパブリックコメントより',
        response: 'いただいた御意見は、今後の施策検討の参考とさせていただきます。',
        responseLabel: '区分C：今後の参考とさせていただくもの',
      },
    ],
    issuesEvidence: {
      confirmed: [],
      considerations: [],
      analysisGaps: [
        '今回確認したのは2つの案件のみである。他の案件（都市計画道路見直し等、複数の実施結果が公開されている）の応募状況は確認しておらず、横断的な件数比較は行っていない。',
      ],
    },
    sourceList: [
      { label: '「宇部市人口ビジョン」及び「第2期宇部市まち・ひと・しごと創生総合戦略」改訂素案パブリックコメント実施結果', url: 'https://www.city.ube.yamaguchi.jp/shisei/kouhou/ikenchoushuu/1007973/1022091/1024261.html', type: 'primary' },
      { label: 'DX推進｜宇部市公式ウェブサイト', url: 'https://www.city.ube.yamaguchi.jp/shisei/keikaku/1021095/index.html', type: 'primary' },
      { label: '加古川市版Decidimについて', url: 'https://kakogawa.diycities.jp/pages/kakogawa-decidim?format=html&locale=ja', type: 'reference' },
    ],
  },
]

export function getPolicyBySlug(slug: string): Policy | undefined {
  return policies.find(p => p.slug === slug)
}
