// @ts-ignore -- Vitest source-contract test reads shared CSS in Node.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync(new URL('./scene.css',import.meta.url),'utf8');

describe('V14 visible scene atmosphere',()=>{
  it.each(['spring','summer','autumn','winter'])('renders a distinct %s season layer',season=>{
    expect(css).toContain(`data-layer-token="season:${season}"`);
  });

  it.each(['dawn','day','sunset','night'])('renders a distinct %s lighting layer',time=>{
    expect(css).toContain(`data-layer-token="lighting:${time}"`);
  });

  it.each(['clear','cloudy','rain','snow','mist'])('renders a distinct %s weather layer',weather=>{
    expect(css).toContain(`data-layer-token="weather:${weather}"`);
  });

  it('keeps weather presentation static and reduced-motion friendly',()=>{
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).not.toContain('@keyframes v14-scene-rain');
    expect(css).not.toContain('@keyframes v14-scene-snow');
  });
});
