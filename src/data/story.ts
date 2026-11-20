/**
 * 「佐藤祥子の物語」: the eight-part series posted on Instagram, shown on
 * 私について as a compact list of links (no embeds: Instagram's embed
 * script would load Meta's tracking and is blocked by the CSP).
 *
 * `title` is optional — fill it in only with the wording the operator
 * gives; leave it out rather than guessing.
 */
export interface StoryEpisode {
  episode: number
  url: string
  title?: string
}

export const storyEpisodes: StoryEpisode[] = [
  { episode: 1, url: 'https://www.instagram.com/p/DeEDqSzv8Jk/' },
  { episode: 2, url: 'https://www.instagram.com/p/DeHEGYdS6OO/' },
  { episode: 3, url: 'https://www.instagram.com/p/DeIfRNmvlo3/' },
  { episode: 4, url: 'https://www.instagram.com/p/DeKvktczLp4/' },
  { episode: 5, url: 'https://www.instagram.com/p/DeNWBkZzsRe/' },
  { episode: 6, url: 'https://www.instagram.com/p/DeRosZtPhby/' },
  { episode: 7, url: 'https://www.instagram.com/p/DeT_HfVP9E7/' },
  { episode: 8, url: 'https://www.instagram.com/p/DeVYukbvpG6/' },
]
