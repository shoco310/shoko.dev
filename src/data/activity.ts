export type ActivityType = 'note' | 'instagram' | 'event' | 'report'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  date: string
  description: string
  thumbnail?: string
  url: string
}

export const activities: Activity[] = [
  {
    id: '1',
    type: 'note',
    title: '13年ぶりに宇部に戻ってきた理由。そして、次の挑戦へ。',
    date: '2026-06-06', // note公開日
    description:
      'エンジニアとして、コミュニティ運営者として、母として。宇部で挑戦する人を増やしたいという想いから、市政への挑戦を表明しました。ぜひ全文を読んでいただけると嬉しいです。',
    thumbnail: 'https://assets.st-note.com/production/uploads/images/282744910/rectangle_large_type_2_45b3458da69c2b92cface398a873169e.jpeg?width=800',
    url: 'https://note.com/satoshoco/n/n073cb334dd8b',
  },
  {
    id: '2',
    type: 'instagram',
    title: '生成AIを「基礎 → 実践」まで体験するイベントを開催しました',
    date: '2026-04-18',
    description:
      '講演 & ワークショップ形式で、生成AIを基礎から実践まで一気通貫で体験できるイベントを開催。参加者の皆さんと一緒に楽しく学びました。',
    thumbnail: '/images/activity/ig-ai-event.jpg',
    url: 'https://www.instagram.com/p/DXRfshzj_y7/',
  },
  {
    id: '3',
    type: 'note',
    title: 'カンファレンス託児サポートをしています',
    date: '2026-01-31',
    description:
      '子育て中でも学びの場に参加できるよう、カンファレンス託児サポートの取り組みを続けています。誰もが参加できる場づくりを目指して。',
    thumbnail: 'https://assets.st-note.com/production/uploads/images/248020863/rectangle_large_type_2_f00d9df40de7d69f46603ce4cd9a0e3d.png?width=800',
    url: 'https://note.com/satoshoco/n/n83a6263e1246',
  },
  {
    id: '4',
    type: 'instagram',
    title: '山口県宇部市のお祭りで、13年ぶりに御神輿を担ぎました',
    date: '2026-05-05',
    description:
      '地元のお祭りに参加し、13年ぶりに御神輿を担ぎました。地域の皆さんと汗をかきながら、宇部のあたたかさを再確認した一日でした。',
    thumbnail: '/images/activity/ig-omikoshi.jpg',
    url: 'https://www.instagram.com/p/DX80roSPnAp/',
  },
  {
    id: '5',
    type: 'note',
    title: 'Forbes JAPAN「Women in Tech 30」2026 に選出されました',
    date: '2026-01-31',
    description:
      '「テクノロジー領域で世界を変える30人」に選出いただきました。この機会を宇部への活動につなげていきます。',
    thumbnail: 'https://assets.st-note.com/production/uploads/images/248013228/rectangle_large_type_2_a34e8dee9ad932edbc7a7ebfd48601e8.jpeg?width=800',
    url: 'https://note.com/satoshoco/n/nf8a6380b8fab',
  },
    {
    id: '6',
    type: 'instagram',
    title: '「エンジニア×地域コミュニティ〜宇部のこれから〜」に登壇しました',
    date: '2025-10-16',
    description:
      '「エンジニア×地域コミュニティ ～佐藤祥子さんと考える、宇部のこれから〜」に登壇。エンジニアの視点から地域の未来について語り合いました。',
    thumbnail: '/images/activity/ig-todan.jpg',
    url: 'https://www.instagram.com/p/DP3ypeHD7aM/',
  },
]
