import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import RpgChronicleFeature from './RpgChronicleFeature';

describe('RPG chronicle interiors',()=>{
  it('renders lineage history as a dedicated archive interior',()=>{
    const html=renderToStaticMarkup(<RpgChronicleFeature feature="lineage" state={initialState} onBack={vi.fn()}/>);
    expect(html).toContain('가문 연대기');
    expect(html).toContain('GENERATION');
    expect(html).toContain('ARCHIVE · LINEAGE');
    expect(html).not.toContain('v8-category-entry');
  });

  it('renders world history as a dedicated archive interior',()=>{
    const html=renderToStaticMarkup(<RpgChronicleFeature feature="world_chronicle" state={initialState} onBack={vi.fn()}/>);
    expect(html).toContain('세계 연대기');
    expect(html).toContain('WORLD MEMORY');
    expect(html).toContain('ARCHIVE · WORLD');
    expect(html).not.toContain('v8-category-entry');
  });
});
