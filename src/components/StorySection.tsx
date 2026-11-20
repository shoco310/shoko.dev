import { Section, SectionHeading } from './ui'
import { storyEpisodes } from '../data/story'

/** 私について: links to the eight Instagram episodes, kept to a compact grid. */
export default function StorySection() {
  return (
    <Section id="story" width="narrow" labelledBy="story-h">
      <SectionHeading
        id="story-h"
        kicker="Story"
        title="佐藤祥子の物語（全8話）"
        lead="Instagramで連載したストーリーです。各話はInstagramで開きます。"
      />
      <ol className="story-list">
        {storyEpisodes.map(e => (
          <li key={e.url}>
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="story-list__link">
              <span className="story-list__num">第{e.episode}話</span>
              <span className="story-list__title">{e.title ?? 'Instagramで見る'}</span>
              <span className="visually-hidden">（Instagram、新しいタブで開きます）</span>
              <span className="story-list__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ol>
    </Section>
  )
}
