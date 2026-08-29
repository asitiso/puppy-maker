import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import InteractiveObject from './InteractiveObject';
import type {ResolvedSceneInteraction,SceneAnchor} from './scene-types';

const anchor:SceneAnchor={id:'trace',x:56,y:63};

function interaction(overrides:Partial<ResolvedSceneInteraction>={}):ResolvedSceneInteraction{
  return {
    id:'trace',label:'빛나는 흔적 조사',mode:'explore',anchorId:'trace',enabled:true,hint:'new',
    ...overrides,
  };
}

describe('V14 environmental scene interaction object',()=>{
  it('renders an icon marker, readable label, and compact hint badge from existing interaction metadata',()=>{
    const html=renderToStaticMarkup(<InteractiveObject interaction={interaction()} anchor={anchor} onInteraction={vi.fn()}/>);
    expect(html).toContain('v14-scene-object__marker');
    expect(html).toContain('data-icon-token="compass"');
    expect(html).toContain('data-family="discovery"');
    expect(html).toContain('data-emphasis="new"');
    expect(html).toContain('v14-scene-object__label');
    expect(html).toContain('v14-scene-object__badge');
    expect(html).toContain('NEW');
  });

  it('preserves the existing accessible name and disabled interaction behavior',()=>{
    const enabled=renderToStaticMarkup(<InteractiveObject interaction={interaction({hint:'required'})} anchor={anchor} onInteraction={vi.fn()}/>);
    const disabled=renderToStaticMarkup(<InteractiveObject interaction={interaction({enabled:false,hint:'required'})} anchor={anchor} onInteraction={vi.fn()}/>);
    expect(enabled).toContain('aria-label="빛나는 흔적 조사"');
    expect(enabled).toContain('>필수<');
    expect(disabled).toContain('disabled=""');
    expect(disabled).toContain('aria-disabled="true"');
    expect(disabled).toContain('data-emphasis="disabled"');
  });

  it('aligns edge anchors inward so action labels do not clip outside the scene',()=>{
    const left=renderToStaticMarkup(<InteractiveObject interaction={interaction()} anchor={{id:'exit',x:8,y:60}} onInteraction={vi.fn()}/>);
    const center=renderToStaticMarkup(<InteractiveObject interaction={interaction()} anchor={anchor} onInteraction={vi.fn()}/>);
    const right=renderToStaticMarkup(<InteractiveObject interaction={interaction()} anchor={{id:'rift',x:88,y:31}} onInteraction={vi.fn()}/>);
    expect(left).toContain('data-edge="left"');
    expect(center).toContain('data-edge="center"');
    expect(right).toContain('data-edge="right"');
  });
});
