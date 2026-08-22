import {describe,expect,it} from 'vitest';
import {mainCampaignIds,majorOutcomeResults,type MainCampaignId,type MajorOutcomeResult} from './campaign-model';
import {emptyCharacterBondsState,hydrateCharacterBondsState} from './character-bonds';
import {
  applySummerStoryBondConsequence,
  resolveSummerCampaignStory,
  summerCampaignStoryDefinition,
  summerCampaignStoryPresentation,
} from './summer-campaign-story';

const representativeByCampaign:Record<MainCampaignId,'mira'|'kael'|'rex'|'selene'>={
  caretaker:'mira',pathfinder:'kael',vanguard:'rex',arcanist:'selene',
};

describe('V3 Summer campaign story + Character Bond',()=>{
  it('defines a distinct Summer story identity for every main Campaign',()=>{
    const definitions=mainCampaignIds.map(campaign=>summerCampaignStoryDefinition(campaign));
    expect(definitions.map(definition=>definition?.character)).toEqual(['mira','kael','rex','selene']);
    expect(new Set(definitions.map(definition=>definition?.chapterId)).size).toBe(4);
    expect(new Set(definitions.map(definition=>definition?.objectiveKey)).size).toBe(4);
    expect(summerCampaignStoryDefinition('true_path' as never)).toBeNull();
    expect(summerCampaignStoryDefinition('stale_campaign' as never)).toBeNull();
  });

  it.each(mainCampaignIds)('resolves all Guardian Festival outcomes as fail-forward Summer story for %s',campaign=>{
    for(const outcome of majorOutcomeResults){
      const result=resolveSummerCampaignStory(campaign,outcome);
      expect(result.resolved).toBe(true);
      expect(result.campaign).toBe(campaign);
      expect(result.character).toBe(representativeByCampaign[campaign]);
      expect(result.outcome).toBe(outcome);
      expect(result.memoryId).toContain(`${representativeByCampaign[campaign]}_summer_festival_`);
      expect(result.storyBeatKey.length).toBeGreaterThan(0);
      expect(result.nextActionKey.length).toBeGreaterThan(0);
    }
  });

  it('keeps malformed campaign/outcome unresolved without inventing a result',()=>{
    expect(resolveSummerCampaignStory('stale_campaign' as never,'victory')).toMatchObject({resolved:false,campaign:null,outcome:null});
    expect(resolveSummerCampaignStory('caretaker','stale_outcome' as never)).toMatchObject({resolved:false,campaign:'caretaker',outcome:null});
  });

  it.each(mainCampaignIds)('applies the representative Character Bond consequence exactly once for %s',campaign=>{
    const outcome:MajorOutcomeResult=campaign==='vanguard'?'costly_victory':'victory';
    const result=resolveSummerCampaignStory(campaign,outcome);
    const initial=emptyCharacterBondsState();
    const first=applySummerStoryBondConsequence(initial,result);
    const second=applySummerStoryBondConsequence(first.bonds,result);
    const character=representativeByCampaign[campaign];

    expect(first.applied).toBe(true);
    expect(first.bonds[character].memories).toContain(result.memoryId);
    expect(first.bonds[character].trust).toBeGreaterThan(initial[character].trust);
    expect(second.applied).toBe(false);
    expect(second.bonds).toEqual(first.bonds);
  });

  it('uses mixed fail-forward Bond consequences for costly victory and defeat',()=>{
    const costly=resolveSummerCampaignStory('caretaker','costly_victory');
    const defeat=resolveSummerCampaignStory('arcanist','defeat');
    const afterCostly=applySummerStoryBondConsequence(emptyCharacterBondsState(),costly).bonds;
    const afterDefeat=applySummerStoryBondConsequence(emptyCharacterBondsState(),defeat).bonds;

    expect(afterCostly.mira.conflicts.length+afterCostly.mira.promises.length).toBeGreaterThan(0);
    expect(afterDefeat.selene.conflicts.length).toBeGreaterThan(0);
  });

  it('exposes a qualitative 05 handoff DTO without raw affinity or numeric trust',()=>{
    const result=resolveSummerCampaignStory('pathfinder','victory');
    const bonds=applySummerStoryBondConsequence(emptyCharacterBondsState(),result).bonds;
    const view=summerCampaignStoryPresentation('pathfinder','victory',bonds);
    const serialized=JSON.stringify(view);

    expect(view).toMatchObject({
      campaign:'pathfinder',character:'kael',status:'resolved',outcomeKey:'summer.pathfinder.outcome.victory',
    });
    expect(view.relationshipChange.length).toBeGreaterThan(0);
    expect(view.memories.length).toBeGreaterThan(0);
    expect(serialized).not.toMatch(/campaignAffinities|affinity|rawScore|trust|score/i);
  });

  it('keeps valid Summer Bond ids through hydration and drops stale ids',()=>{
    const result=resolveSummerCampaignStory('arcanist','victory');
    const bonds=applySummerStoryBondConsequence(emptyCharacterBondsState(),result).bonds;
    const hydrated=hydrateCharacterBondsState({
      ...bonds,
      selene:{...bonds.selene,memories:[...bonds.selene.memories,'stale_memory']},
    });

    expect(hydrated.selene.memories).toContain(result.memoryId);
    expect(hydrated.selene.memories).not.toContain('stale_memory');
  });
});