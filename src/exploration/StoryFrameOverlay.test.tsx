import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import StoryFrameOverlay from './StoryFrameOverlay';
import type {ExplorationStoryFrame} from './exploration-types';

const frame:ExplorationStoryFrame={
  id:'focus-contract',
  title:'달라진 세계',
  text:'스토리 프레임이 열리면 키보드 포커스도 프레임 안으로 이동해야 한다.',
  artSrc:'/assets/exploration/test-art.svg',
  frameSrc:'/assets/exploration/test-frame.svg',
  actionLabel:'계속',
  progression:false,
};

describe('StoryFrameOverlay accessibility',()=>{
  it('moves initial keyboard focus into the modal story frame',()=>{
    const html=renderToStaticMarkup(<StoryFrameOverlay frame={frame} onComplete={vi.fn()}/>);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="exploration-story-title-focus-contract"');
    expect(html).toContain('aria-describedby="exploration-story-text-focus-contract"');
    expect(html).toContain('autofocus=""');
  });
});
