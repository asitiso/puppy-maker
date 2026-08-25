import {describe,expect,it} from 'vitest';
import {
  buildAncestorRecord,
  deriveHeritageTraits,
  dominantPersonalityKey,
} from './lineage';

const balanced={courage:20,kindness:20,curiosity:20,calmness:20};

describe('V5 deterministic heritage derivation',()=>{
  it('breaks personality ties deterministically and maps identity to one narrative heritage trait',()=>{
    expect(dominantPersonalityKey(balanced)).toBe('courage');
    expect(dominantPersonalityKey({...balanced,kindness:80})).toBe('kindness');
    expect(dominantPersonalityKey({...balanced,curiosity:80})).toBe('curiosity');
    expect(dominantPersonalityKey({...balanced,calmness:80})).toBe('calmness');

    expect(deriveHeritageTraits({personality:{...balanced,kindness:80},route:null,worldFacts:[]})).toEqual(['warm_heart']);
    expect(deriveHeritageTraits({personality:{...balanced,courage:80},route:null,worldFacts:[]})).toEqual(['steadfast_guardian']);
    expect(deriveHeritageTraits({personality:{...balanced,curiosity:80},route:null,worldFacts:[]})).toEqual(['trail_memory']);
    expect(deriveHeritageTraits({personality:{...balanced,calmness:80},route:null,worldFacts:[]})).toEqual(['arcane_echo']);
  });

  it('is deterministic, bounded, and gives completed True/Hollow routes a narrative echo slot',()=>{
    const trueInput={
      personality:{...balanced,kindness:90},
      route:'true_path' as const,
      worldFacts:['festival_saved','regional_alliance','rift_stabilized'] as const,
    };
    const hollowInput={
      personality:{...balanced,courage:90},
      route:'hollow' as const,
      worldFacts:['hollow_shortcut_taken','hollow_rift_entrenched','rift_unstable'] as const,
    };

    expect(deriveHeritageTraits(trueInput)).toEqual(['warm_heart','true_echo']);
    expect(deriveHeritageTraits(trueInput)).toEqual(deriveHeritageTraits(trueInput));
    expect(deriveHeritageTraits(hollowInput)).toEqual(['steadfast_guardian','hollow_echo']);
    expect(deriveHeritageTraits(hollowInput)).toHaveLength(2);
  });

  it('uses world_witness for a strong world footprint when a special route does not consume the second slot',()=>{
    expect(deriveHeritageTraits({
      personality:{...balanced,curiosity:70},
      route:'pathfinder',
      worldFacts:['festival_saved','regional_alliance','ancient_route_opened'],
    })).toEqual(['trail_memory','world_witness']);
  });

  it('builds a canonical ancestor snapshot without duplicate or invalid world facts',()=>{
    const record=buildAncestorRecord({
      generation:3.8,
      yearsLived:5.9,
      route:'true_path',
      ending:'true_rewoven',
      guardianRank:'starlight',
      personality:{...balanced,kindness:75},
      worldFacts:['regional_alliance','bad','festival_saved','regional_alliance'],
    });

    expect(record).toEqual({
      generation:3,
      yearsLived:5,
      route:'true_path',
      ending:'true_rewoven',
      guardianRank:'starlight',
      personalityKey:'kindness',
      majorWorldFacts:['festival_saved','regional_alliance'],
      heritageTraits:['warm_heart','true_echo'],
    });
    expect(buildAncestorRecord({
      generation:3.8,
      yearsLived:5.9,
      route:'true_path',
      ending:'true_rewoven',
      guardianRank:'starlight',
      personality:{...balanced,kindness:75},
      worldFacts:['regional_alliance','bad','festival_saved','regional_alliance'],
    })).toEqual(record);
  });
});
