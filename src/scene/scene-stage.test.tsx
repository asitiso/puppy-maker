import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import SceneStage from './SceneStage';
import {resolveScene} from './scene-resolver';

const css=readFileSync(new URL('./scene.css',import.meta.url),'utf8');

describe('V14 anchored living scene stage',()=>{
  it('renders actors and accessible interaction anchors inside the living stage',()=>{
    const scene=resolveScene({year:1,month:4,week:1,location:'home'});
    const html=renderToStaticMarkup(<SceneStage scene={scene} onInteraction={vi.fn()}/>);
    expect(html).toContain('v14-scene-stage');
    expect(html).toContain('data-actor-id="runa"');
    expect(html).toMatch(/data-actor-id="runa"[^>]*data-anchor-id="(?:runa|desk|world_map)"/);
    expect(html).toContain('data-interaction-id="bed"');
    expect(html).toContain('aria-label="잠깐 쉬기"');
  });

  it('keeps mobile targets, safe area, focus visibility, and reduced-motion parity in shared CSS',()=>{
    expect(css).toContain('min-width:44px');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
