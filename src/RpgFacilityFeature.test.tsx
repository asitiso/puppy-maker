import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import RpgFacilityFeature from './RpgFacilityFeature';

describe('RPG facility feature shell',()=>{
  it('renders the room first and does not mount the heavy system before interaction',()=>{
    const renderSystem=vi.fn(()=> <div>heavy-system</div>);
    const html=renderToStaticMarkup(<RpgFacilityFeature
      feature="sanctuary"
      state={initialState}
      onExit={vi.fn()}
      renderSystem={renderSystem}
    />);
    expect(html).toContain('별빛 성소 내부 시설 내부');
    expect(html).toContain('성소 핵심 제단 · 장기 성장');
    expect(html).toContain('FACILITY · 별빛 성소 내부');
    expect(html).not.toContain('heavy-system');
    expect(renderSystem).not.toHaveBeenCalled();
  });

  it('shows growth resources in the room HUD without mutating state',()=>{
    const html=renderToStaticMarkup(<RpgFacilityFeature
      feature="inventory"
      state={initialState}
      onExit={vi.fn()}
      renderSystem={()=>null}
    />);
    expect(html).toContain(`성장 PT ${initialState.growthPoints}`);
    expect(html).toContain(`${initialState.gold.toLocaleString()}G`);
  });
});
