import {describe,expect,it} from 'vitest';
import {emptyCharacterBondsState} from './character-bonds';
import {
  applyAutumnChoiceBondConsequence,
  autumnChoiceDefinition,
  autumnChoicePresentation,
  commitAutumnMajorChoice,
  resolveAutumnChoiceOptions,
  type AutumnChoiceContext,
} from './autumn-major-choice';

const context=(overrides:Partial<AutumnChoiceContext>={}):AutumnChoiceContext=>({
  thirdEligible:false,
  characterBonds:emptyCharacterBondsState(),
  ...overrides,
});

describe('V3 Autumn Major Choice domain',()=>{
  it.each([
    ['caretaker','caretaker_autumn',['save_one','spread_risk'],'team_solution'],
    ['pathfinder','pathfinder_autumn',['open_route','seal_route'],'limited_access'],
    ['vanguard','vanguard_autumn',['centralize','preserve_independence'],'coalition_command'],
    ['arcanist','arcanist_autumn',['use_relic','destroy_relic'],'controlled_use'],
  ] as const)('defines two base options and one earned option for %s',(campaign,choiceId,baseOptions,earned)=>{
    const definition=autumnChoiceDefinition(campaign);
    expect(definition).toMatchObject({campaign,choiceId,baseOptions,earnedOption:earned});
    expect(new Set(definition?.baseOptions).size).toBe(2);
  });

  it.each([
    ['caretaker','team_solution'],
    ['pathfinder','limited_access'],
    ['vanguard','coalition_command'],
    ['arcanist','controlled_use'],
  ] as const)('consumes the upstream third-option eligibility result without reinterpreting evidence for %s',(campaign,earned)=>{
    const locked=resolveAutumnChoiceOptions(campaign,context({thirdEligible:false}));
    const earnedResult=resolveAutumnChoiceOptions(campaign,context({thirdEligible:true}));
    expect(locked.options).toHaveLength(2);
    expect(locked.earned).toMatchObject({available:false,optionId:earned});
    expect(earnedResult.options).toHaveLength(3);
    expect(earnedResult.earned).toMatchObject({available:true,optionId:earned});
  });

  it('rejects unavailable earned options and malformed choices without inventing progression',()=>{
    expect(commitAutumnMajorChoice('caretaker','team_solution',context(),null).status).toBe('not_available');
    expect(commitAutumnMajorChoice('caretaker','stale_option' as never,context(),null).status).toBe('invalid_option');
    expect(commitAutumnMajorChoice('stale_campaign' as never,'save_one',context(),null).status).toBe('invalid_campaign');
  });

  it('locks the first valid commit and makes replay/re-entry idempotent',()=>{
    const first=commitAutumnMajorChoice('pathfinder','seal_route',context(),null);
    expect(first.status).toBe('committed');
    const same=commitAutumnMajorChoice('pathfinder','seal_route',context(),first.commitment);
    const conflict=commitAutumnMajorChoice('pathfinder','open_route',context(),first.commitment);
    expect(same.status).toBe('already_committed');
    expect(same.commitment).toEqual(first.commitment);
    expect(conflict.status).toBe('locked');
    expect(conflict.commitment).toEqual(first.commitment);
  });

  it.each(['exceptional_victory','victory','costly_victory','defeat'] as const)('keeps Autumn consequence fail-forward after Great Expedition %s',outcome=>{
    const committed=commitAutumnMajorChoice('arcanist','destroy_relic',context(),null,outcome);
    expect(committed.status).toBe('committed');
    expect(committed.aftermath?.storyBeatKey).toContain(`autumn.arcanist.destroy_relic.${outcome}`);
    expect(committed.aftermath?.winterTensionKey.length).toBeGreaterThan(0);
  });

  it('applies representative Bond consequence exactly once',()=>{
    const committed=commitAutumnMajorChoice('vanguard','preserve_independence',context(),null,'costly_victory');
    const initial=emptyCharacterBondsState();
    const first=applyAutumnChoiceBondConsequence(initial,committed.aftermath);
    const second=applyAutumnChoiceBondConsequence(first.bonds,committed.aftermath);
    expect(first.applied).toBe(true);
    expect(first.bonds.rex.memories).toContain('rex_autumn_preserve_independence');
    expect(second.applied).toBe(false);
    expect(second.bonds).toEqual(first.bonds);
  });

  it('keeps every earned choice commit-able when the upstream gate is open',()=>{
    for(const [campaign,choice] of [
      ['caretaker','team_solution'],['pathfinder','limited_access'],['vanguard','coalition_command'],['arcanist','controlled_use'],
    ] as const){
      expect(commitAutumnMajorChoice(campaign,choice,context({thirdEligible:true}),null).status).toBe('committed');
    }
  });

  it('exposes qualitative presentation without raw eligibility internals, scores, or numeric trust',()=>{
    const resolved=resolveAutumnChoiceOptions('caretaker',context());
    const view=autumnChoicePresentation(resolved);
    const serialized=JSON.stringify(view);
    expect(view.options).toHaveLength(3);
    expect(view.options[2]).toMatchObject({available:false});
    expect(view.options[2].hint.length).toBeGreaterThan(0);
    expect(serialized).not.toMatch(/trust|score|requirement|threshold|campaignAffinities|raw|evidence/i);
  });
});
