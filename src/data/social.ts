/** Official external accounts and forms. One place, so every link stays the same. */
export const lineUrl = 'https://lin.ee/Rgs1sYR3'

/** Supporters' association sign-up (Google Form, run by the association). */
export const associationFormUrl = 'https://forms.gle/z3RQbWGoreoUCiZ4A'

export type SocialKey = 'x' | 'instagram' | 'youtube' | 'facebook' | 'note'

export const socialLinks: { key: SocialKey; label: string; href: string }[] = [
  { key: 'x', label: 'X', href: 'https://x.com/shoko_sato_ube' },
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/shoko_sato_ube/' },
  { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@satoshoco' },
  { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61590433598518' },
  { key: 'note', label: 'note', href: 'https://note.com/satoshoco' },
]
