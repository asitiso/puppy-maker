import {describe,expect,it} from 'vitest';
import {emptyCareerRecords,type CareerRecords} from './career-records';
import {emptyCharacterBondsState,type CharacterBondsState} from './character-bonds';
import type {MainCampaignId,MajorChoiceOptionId,MajorOutcomeResult} from './campaign-model';
import {
  applyWinterBondResolution,
  resolveWinterEndingStory,
  winterCampaignDefinition,
  winterEndingPresentation,
  type WinterEndingStoryInput,
} from './winter-ending-story';

const autumnChoice:Record<MainCampaignId,MajorChoiceOptionId>={
  caretaker:'team_solution',
  pathfinder:'limited_access',
  vanguard:'coalition_command',
  arcanist:'controlled_use',
};

const representative={caretaker:'mira',pathfinder:'kael',vanguard:'rex',arcanist:'selene'} as const;

const career=(patch:Partial<CareerRecords>={}):CareerRecords=>({...emptyCareerRecords(),...patch});
const bonds=():CharacterBondsState=>emptyCharacterBondsState();
const input=(campaign:MainCampaignId,overrides:Partial<WinterEndingStoryInput>={}):WinterEndingStoryInput=>({
  campaign,
  autumnChoice:autumnChoice[campaign],
  longNightOutcome:'victory',
  characterBonds:bonds(),
  careerRecords:career({trainings:12,outings:4,gifts:2,monthsCompleted:10}),
  careerTitles:['steady_trainer'],
  ...overrides,
});

describe('V3 Winter story + modular ending semantics',()=>{
  it.each([
    ['caretaker','mira','winter.caretaker.long_night'],
    ['pathfinder','kael','winter.pathfinder.long_night'],
    ['vanguard','rex','winter.vanguard.long_night'],
    ['arcanist','selene','winter.arcanist.long_night'],
  ] as const)('defines distinct Long Night framing for %s',(campaign,character,storyKey)=>{
    expect(winterCampaignDefinition(campaign)).toMatchObject({campaign,representative:character,storyKey});
  });

  it.each(['exceptional_victory','victory','costly_victory','defeat'] as const)(
    'resolves fail-forward ending semantics for Long Night %s',
    (outcome:MajorOutcomeResult)=>{
      const result=resolveWinterEndingStory(input('caretaker',{longNightOutcome:outcome}));
      expect(result.status).toBe('resolved');
      expect(result.campaignResolution.outcome).toBe(outcome);
      expect(result.epilogueKey).toContain(outcome);
    },
  );

  it('lets the Autumn choice materially change Campaign resolution semantics',()=>{
    const shared=resolveWinterEndingStory(input('caretaker',{autumnChoice:'team_solution'}));
    const burden=resolveWinterEndingStory(input('caretaker',{autumnChoice:'save_one'}));
    expect(shared.campaignResolution.key).not.toBe(burden.campaignResolution.key);
    expect(shared.campaignResolution.summaryKey).not.toBe(burden.campaignResolution.summaryKey);
  });

  it('derives Bond resolution from promises/conflicts/memories, not numeric trust alone',()=>{
    const highTrust=bonds();
    highTrust.mira.trust=999;
    highTrust.mira.conflicts=['mira_autumn_single_rescue_burden'];
    const resolvedConflict=bonds();
    resolvedConflict.mira.trust=2;
    resolvedConflict.mira.promises=['mira_autumn_team_solution'];
    resolvedConflict.mira.memories=['mira_autumn_team_solution'];

    const strained=resolveWinterEndingStory(input('caretaker',{characterBonds:highTrust}));
    const shared=resolveWinterEndingStory(input('caretaker',{characterBonds:resolvedConflict}));
    expect(strained.bondResolution.key).not.toBe(shared.bondResolution.key);
    expect(shared.bondResolution.character).toBe('mira');
  });

  it('uses existing Career records/titles to produce a qualitative Career dimension',()=>{
    const veteran=resolveWinterEndingStory(input('vanguard',{
      careerRecords:career({trainings:40,bestScore:980,sGrades:14,outings:20,gifts:7,monthsCompleted:12}),
      careerTitles:['steady_trainer','perfect_chaser','seasoned_explorer','warm_giver','veteran_guardian'],
    }));
    const novice=resolveWinterEndingStory(input('vanguard',{careerRecords:career(),careerTitles:[]}));
    expect(veteran.careerResolution.key).not.toBe(novice.careerResolution.key);
    expect(veteran.careerResolution.label.length).toBeGreaterThan(0);
  });

  it.each(Object.keys(representative) as MainCampaignId[])('returns four independent semantic dimensions for %s',campaign=>{
    const result=resolveWinterEndingStory(input(campaign));
    expect(result).toMatchObject({
      campaignResolution:{campaign},
      bondResolution:{character:representative[campaign]},
      worldResolution:{outcome:'victory'},
      careerResolution:{},
    });
  });

  it('applies the representative Winter Bond aftermath exactly once',()=>{
    const result=resolveWinterEndingStory(input('pathfinder'));
    const first=applyWinterBondResolution(bonds(),result.bondAftermath);
    const second=applyWinterBondResolution(first.bonds,result.bondAftermath);
    expect(first.applied).toBe(true);
    expect(first.bonds.kael.memories).toContain(result.bondAftermath?.memoryId);
    expect(second.applied).toBe(false);
    expect(second.bonds).toEqual(first.bonds);
  });

  it('rejects campaign/autumn-choice mismatches instead of inventing an ending',()=>{
    const result=resolveWinterEndingStory(input('arcanist',{autumnChoice:'coalition_command'}));
    expect(result.status).toBe('invalid_input');
    expect(result.bondAftermath).toBeNull();
  });

  it('sanitizes malformed outcome to a valid fail-forward resolution',()=>{
    const result=resolveWinterEndingStory(input('pathfinder',{longNightOutcome:'stale' as never}));
    expect(result.status).toBe('resolved');
    expect(['exceptional_victory','victory','costly_victory','defeat']).toContain(result.worldResolution.outcome);
  });

  it('exposes a qualitative Ending DTO with exactly four dimensions and no raw scores/trust',()=>{
    const result=resolveWinterEndingStory(input('arcanist'));
    const view=winterEndingPresentation(result);
    expect(view.dimensions.map(item=>item.id)).toEqual(['campaign','bond','world','career']);
    const serialized=JSON.stringify(view);
    expect(serialized).not.toMatch(/score|trust|affinit|threshold|raw|bestScore|sGrades/i);
    expect(view.epilogueKey.length).toBeGreaterThan(0);
  });
});
