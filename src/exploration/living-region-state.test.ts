import {describe,expect,it} from 'vitest';
import {
  advanceLivingRegionPostResolution,
  applyLivingRegionUpdate,
  emptyLivingRegionState,
  enterLivingRegion,
  hydrateLivingRegionState,
  recordLivingRegionDiscovery,
  recordLivingRegionInteraction,
  resolveLivingRegionMainQuest,
  startLivingRegionMainQuest,
} from './living-region-state';

describe('V16 living region state',()=>{
  it('creates independent inert progress for every living region',()=>{
    const first=emptyLivingRegionState();
    const second=emptyLivingRegionState();
    expect(first).toEqual({
      old_shrine:{phase:'unvisited',discoveries:[],completedInteractions:[]},
      herb_hills:{phase:'unvisited',discoveries:[],completedInteractions:[]},
      expedition_outpost:{phase:'unvisited',discoveries:[],completedInteractions:[]},
    });
    first.old_shrine.discoveries.push('broken_seal');
    expect(second.old_shrine.discoveries).toEqual([]);
  });

  it('sanitizes malformed persisted region progress and ignores unknown regions',()=>{
    const state=hydrateLivingRegionState({
      old_shrine:{
        phase:'mainQuestResolved',
        discoveries:['broken_seal','broken_seal',' ',4],
        completedInteractions:['altar',' altar ',null],
      },
      herb_hills:{phase:'corrupt',discoveries:'bad',completedInteractions:[]},
      expedition_outpost:null,
      unknown_region:{phase:'postResolution'},
    });
    expect(state.old_shrine).toEqual({
      phase:'mainQuestResolved',
      discoveries:['broken_seal'],
      completedInteractions:['altar'],
    });
    expect(state.herb_hills).toEqual({phase:'unvisited',discoveries:[],completedInteractions:[]});
    expect(state.expedition_outpost).toEqual({phase:'unvisited',discoveries:[],completedInteractions:[]});
    expect(Object.keys(state)).toEqual(['old_shrine','herb_hills','expedition_outpost']);
  });

  it('allows only the authored forward quest phase sequence',()=>{
    const initial=emptyLivingRegionState();
    expect(startLivingRegionMainQuest(initial,'old_shrine')).toBe(initial);

    const active=enterLivingRegion(initial,'old_shrine');
    expect(active.old_shrine.phase).toBe('active');
    expect(enterLivingRegion(active,'old_shrine')).toBe(active);

    const inProgress=startLivingRegionMainQuest(active,'old_shrine');
    expect(inProgress.old_shrine.phase).toBe('mainQuestInProgress');
    expect(advanceLivingRegionPostResolution(inProgress,'old_shrine')).toBe(inProgress);

    const resolved=resolveLivingRegionMainQuest(inProgress,'old_shrine');
    expect(resolved.old_shrine.phase).toBe('mainQuestResolved');
    expect(startLivingRegionMainQuest(resolved,'old_shrine')).toBe(resolved);

    const postResolution=advanceLivingRegionPostResolution(resolved,'old_shrine');
    expect(postResolution.old_shrine.phase).toBe('postResolution');
    expect(resolveLivingRegionMainQuest(postResolution,'old_shrine')).toBe(postResolution);
  });

  it('records discoveries and interactions once without mutating prior state',()=>{
    const initial=emptyLivingRegionState();
    const withDiscovery=recordLivingRegionDiscovery(initial,'herb_hills',' rare_herb ');
    expect(initial.herb_hills.discoveries).toEqual([]);
    expect(withDiscovery.herb_hills.discoveries).toEqual(['rare_herb']);
    expect(recordLivingRegionDiscovery(withDiscovery,'herb_hills','rare_herb')).toBe(withDiscovery);
    expect(recordLivingRegionDiscovery(withDiscovery,'herb_hills','   ')).toBe(withDiscovery);

    const withInteraction=recordLivingRegionInteraction(withDiscovery,'herb_hills',' windmill ');
    expect(withDiscovery.herb_hills.completedInteractions).toEqual([]);
    expect(withInteraction.herb_hills.completedInteractions).toEqual(['windmill']);
    expect(recordLivingRegionInteraction(withInteraction,'herb_hills','windmill')).toBe(withInteraction);
  });

  it('applies the narrow update protocol without bypassing forward-only transitions',()=>{
    const initial=emptyLivingRegionState();
    const active=applyLivingRegionUpdate(initial,'old_shrine',{kind:'enter'});
    const started=applyLivingRegionUpdate(active,'old_shrine',{kind:'startMainQuest'});
    const withDiscovery=applyLivingRegionUpdate(started,'old_shrine',{kind:'recordDiscovery',discoveryId:'memory_shard'});
    const withInteraction=applyLivingRegionUpdate(withDiscovery,'old_shrine',{kind:'recordInteraction',interactionId:'rune_console'});
    const resolved=applyLivingRegionUpdate(withInteraction,'old_shrine',{kind:'resolveMainQuest'});
    const post=applyLivingRegionUpdate(resolved,'old_shrine',{kind:'advancePostResolution'});

    expect(post.old_shrine).toEqual({
      phase:'postResolution',
      discoveries:['memory_shard'],
      completedInteractions:['rune_console'],
    });
    expect(applyLivingRegionUpdate(post,'old_shrine',{kind:'startMainQuest'})).toBe(post);
  });
});
