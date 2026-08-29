// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const homeSource=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');
const homeCss=readFileSync(new URL('./layered-home.css',import.meta.url),'utf8');
const resultSource=readFileSync(new URL('./ActionResultSummary.tsx',import.meta.url),'utf8');
const resultCss=readFileSync(new URL('./mobile-v10-guidance.css',import.meta.url),'utf8');
const sceneSource=readFileSync(new URL('./scene/SceneStage.tsx',import.meta.url),'utf8');
const sceneCss=readFileSync(new URL('./scene/scene.css',import.meta.url),'utf8');

describe('V14 polish pass 3 scene and flow continuity contracts',()=>{
  it('derives visible home weather from the resolved scene instead of hard-coded clear weather',()=>{
    expect(homeSource).toContain('weatherLabels[homeScene.weather]');
    expect(homeSource).not.toContain('<span>☀ 맑음</span>');
  });

  it('dismisses the home sheet before handing an outing to the activity flow',()=>{
    expect(homeSource).toContain('const startOuting = (id: OutingLocationId) =>');
    expect(homeSource).toMatch(/startOuting[\s\S]*closePanel\(\)[\s\S]*onOuting\(id\)/);
    expect(homeSource).toContain('onClick={() => startOuting(id)}');
  });

  it('uses a local back affordance and one bounded panel body scroller',()=>{
    expect(homeSource).toContain('← 이전 화면');
    expect(homeSource).toContain('className="lh-panel-body"');
    expect(homeCss).toMatch(/\.lh-panel\{[^}]*overflow:hidden/);
    expect(homeCss).toMatch(/\.lh-panel-body\{[^}]*overflow-y:auto/);
    expect(homeCss).toContain('overscroll-behavior:contain');
  });

  it('announces result handoff and keeps the continuation action above safe-area space',()=>{
    expect(resultSource).toContain('role="status"');
    expect(resultSource).toContain('aria-live="polite"');
    expect(resultSource).toContain('aria-atomic="true"');
    expect(resultCss).toContain('env(safe-area-inset-bottom');
  });

  it('keeps scene identity and environment metadata stable through directed interactions',()=>{
    expect(sceneSource).toContain('key={actor.actorId}');
    expect(sceneSource).toContain('data-location={scene.location}');
    expect(sceneSource).toContain('data-weather={scene.weather}');
    expect(sceneSource).toContain('data-runtime-phase={runtimePhase}');
    expect(sceneCss).toContain('prefers-reduced-motion:reduce');
  });
});
