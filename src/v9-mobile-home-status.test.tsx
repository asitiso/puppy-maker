// @ts-ignore -- Vitest source contracts execute with Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import MobileHomeStatus,{compactResource} from './MobileHomeStatus';

const statusSource=readFileSync(new URL('./MobileHomeStatus.tsx',import.meta.url),'utf8');
const homeSource=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');

describe('V9 mobile home and status',()=>{
  it('renders separate context and resource rows with an independent notification control',()=>{
    const html=renderToStaticMarkup(<MobileHomeStatus state={initialState} notificationCount={3} onNotifications={vi.fn()}/>);
    expect(html).toContain('v9-status-context');
    expect(html).toContain('v9-status-resources');
    expect(html).toContain('새 소식 3개');
    expect(statusSource).toContain('v9-status-notification');
  });

  it('formats large resource values compactly without changing underlying state values',()=>{
    expect(compactResource(9999)).toBe('9,999');
    expect(compactResource(12000)).toBe('12.0K');
    expect(compactResource(125000)).toBe('125K');
    expect(compactResource(1_250_000)).toBe('1.3M');
    expect(compactResource(Number.NaN)).toBe('0');
  });

  it('keeps full resource values accessible when compact display is used',()=>{
    expect(statusSource).toContain('aria-label={`골드 ${safeGold.toLocaleString()}`}`);
    expect(statusSource).toContain('aria-label={`보석 ${safeGems.toLocaleString()}`}`);
  });

  it('consumes semantic home visual slots rather than hard-coded home art paths',()=>{
    expect(homeSource).toContain('MobileSceneBackground');
    expect(homeSource).toContain('slot="home.background"');
    expect(homeSource).toContain('MobileCharacterArt');
    expect(homeSource).toContain('slot="home.hero"');
    expect(homeSource).not.toContain('src="/assets/home/home_bg_layer.webp"');
    expect(homeSource).not.toContain("'/assets/home/runa_idle_layer.png'");
  });

  it('retains exactly one authoritative hubNextAction primary CTA',()=>{
    expect(homeSource).toContain('const primaryTask = hubNextAction(state)');
    expect((homeSource.match(/className="lh-primary-action"/g)??[])).toHaveLength(1);
    expect(homeSource).toContain('runPrimaryTask');
  });
});
