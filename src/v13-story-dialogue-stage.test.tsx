import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import {StoryEvent} from './components/StoryEvent';
import css from './story-dialogue-stage.css?raw';

describe('V13 animated story dialogue stage',()=>{
  it('stages Runa and a guest character on opposite sides without changing story choice data',()=>{
    const html=renderToStaticMarkup(<StoryEvent state={{...initialState,screen:'event',activeEventId:'lost_bird'}} dispatch={vi.fn()}/>);
    expect(html).toContain('story-dialogue-stage');
    expect(html).toContain('story-character story-character--left');
    expect(html).toContain('story-character story-character--right');
    expect(html).toContain('루나');
    expect(html).toContain('고양이');
    expect(html).toContain('함께 돌봐준다');
  });

  it('provides entrance emphasis, dialogue-safe bottom staging, and reduced-motion fallback',()=>{
    expect(css).toContain('@keyframes story-character-enter-left');
    expect(css).toContain('@keyframes story-character-enter-right');
    expect(css).toContain('.story-character.is-speaking');
    expect(css).toContain('.story-dialogue-panel');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
