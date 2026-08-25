import {describe,expect,it} from 'vitest';
import {
  emptyLineageState,
  hydrateLineageState,
  lifeStageForYear,
  lifeStageLabel,
} from './lineage';

describe('V5 lineage domain',()=>{
  it('derives life stage from canonical year boundaries without storing extra stage state',()=>{
    expect(lifeStageForYear(1)).toBe('growing');
    expect(lifeStageForYear(2)).toBe('young_guardian');
    expect(lifeStageForYear(3)).toBe('seasoned_guardian');
    expect(lifeStageForYear(99)).toBe('seasoned_guardian');
    expect(lifeStageForYear(Number.POSITIVE_INFINITY)).toBe('growing');
    expect(lifeStageLabel(1)).toBe('성장기');
    expect(lifeStageLabel(2)).toBe('청년 수호자');
    expect(lifeStageLabel(3)).toBe('숙련 수호자');
  });

  it('hydrates missing or malformed lineage to a safe first generation',()=>{
    expect(hydrateLineageState(undefined)).toEqual(emptyLineageState());
    expect(hydrateLineageState({generation:-8,heritageTraits:'bad',ancestors:{}})).toEqual(emptyLineageState());
    expect(hydrateLineageState({generation:Number.NaN,heritageTraits:[],ancestors:[]})).toEqual(emptyLineageState());
  });

  it('keeps only canonical unique heritage traits in registry order and bounds current heritage to two',()=>{
    const hydrated=hydrateLineageState({
      generation:4.9,
      heritageTraits:['hollow_echo','bad','warm_heart','hollow_echo','world_witness'],
      ancestors:[],
    });
    expect(hydrated.generation).toBe(4);
    expect(hydrated.heritageTraits).toEqual(['warm_heart','hollow_echo']);
  });

  it('sanitizes ancestors, deduplicates generations, sorts them, and keeps only the latest eight',()=>{
    const ancestors=Array.from({length:11},(_,index)=>({
      generation:index+1,
      yearsLived:index===5?Number.POSITIVE_INFINITY:Math.max(1,index+1),
      route:index%2===0?'caretaker':'not-a-route',
      ending:index%3===0?`ending-${index}`:null,
      guardianRank:index===4?'invalid':'guardian',
      personalityKey:index===6?'invalid':'kindness',
      majorWorldFacts:['festival_saved','not-a-fact','festival_saved'],
      heritageTraits:['world_witness','world_witness','bad'],
    }));
    ancestors.push({...ancestors[10],route:'vanguard',guardianRank:'starlight'});

    const hydrated=hydrateLineageState({generation:12,heritageTraits:[],ancestors});

    expect(hydrated.ancestors).toHaveLength(8);
    expect(hydrated.ancestors.map(item=>item.generation)).toEqual([4,5,6,7,8,9,10,11]);
    expect(new Set(hydrated.ancestors.map(item=>item.generation)).size).toBe(8);
    expect(hydrated.ancestors.at(-1)).toMatchObject({
      generation:11,
      guardianRank:'guardian',
      majorWorldFacts:['festival_saved'],
      heritageTraits:['world_witness'],
    });
    expect(hydrated.ancestors.find(item=>item.generation===6)?.yearsLived).toBe(1);
    expect(hydrated.ancestors.find(item=>item.generation===5)?.guardianRank).toBe('trainee');
    expect(hydrated.ancestors.find(item=>item.generation===7)?.personalityKey).toBe('kindness');
    expect(hydrated.ancestors.find(item=>item.generation===4)?.route).toBeNull();
  });
});
