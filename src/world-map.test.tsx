import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import WorldMapScene from './WorldMapScene';

const destinations=[
  {location:'forest' as const,label:'숲',unlocked:true,detail:'탐험 가능'},
  {location:'old_shrine' as const,label:'오래된 사당',unlocked:false,detail:'아직 갈 수 없어요'},
];

describe('V14 visual world map',()=>{
  it('keeps locked destinations visible but non-activatable',()=>{
    const html=renderToStaticMarkup(<WorldMapScene destinations={destinations} onSelect={vi.fn()} onClose={vi.fn()}/>);
    expect(html).toContain('data-location="forest"');
    expect(html).toContain('>숲<');
    expect(html).toContain('data-location="old_shrine"');
    expect(html).toContain('>오래된 사당<');
    expect(html).toMatch(/data-location="old_shrine"[^>]*disabled=""[^>]*aria-disabled="true"/);
    expect(html).not.toMatch(/data-location="forest"[^>]*disabled=""/);
  });
});
