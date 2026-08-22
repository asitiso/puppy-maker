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
  currentWorldFacts:[],
  inheritedWorldFacts:[],
  evidenceKeys:[],
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

  it('never grants an earned third option from inherited history alone',()=>{
    const resolved=resolveAutumnChoiceOptions('caretaker',context({
      inheritedWorldFacts:['festival_saved'],
      evidenceKeys:['caretaker_team_solution_ready'],
    }));
    expect(resolved.options).toHaveLength(2);
    expect(resolved.earned.available).toBe(false);
  });

  it.each([
    ['caretaker','caretaker_team_solution_ready','mira_summer_share_responsibility','team_solution'],
    ['pathfinder','pathfinder_limited_access_ready','kael_summer_respect_boundaries','limited_access'],
    ['vanguard','vanguard_coalition_command_ready','rex_summer_lead_together','coalition_command'],
    ['arcanist','arcanist_controlled_use_ready','selene_summer_restrain_power','controlled_use'],
  ] as const)('unlocks the earned option only from current evidence plus lived Bond history for %s',(campaign,evidence,promise,earned)=>{
    const bonds=emptyCharacterBondsState();
    const character=campaign==='caretaker'?'mira':campaign==='pathfinder'?'kael':campaign==='vanguard'?'rex':'selene';
    bonds[character].promises=[promise];
    const resolved=resolveAutumnChoiceOptions(campaign,context({
      currentWorldFacts:['festival_saved'],
      evidenceKeys:[evidence],
      characterBonds:bonds,
    }));
    expect(resolved.options).toHaveLength(3);
    expect(resolved.earned).toMatchObject({available:true,optionId:earned});
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
    expect(first.bonds.rex.memories.length).toBe(1);
    expect(second.applied).toBe(false);
    expect(second.bonds).toEqual(first.bonds);
  });

  it('exposes qualitative presentation without raw requirements, scores, or numeric trust',()=>{
    const resolved=resolveAutumnChoiceOptions('caretaker',context());
    const view=autumnChoicePresentation(resolved);
    const serialized=JSON.stringify(view);
    expect(view.options).toHaveLength(3);
    expect(view.options[2]).toMatchObject({available:false});
    expect(view.options[2].hint.length).toBeGreaterThan(0);
    expect(serialized).not.toMatch(/trust|score|requirement|threshold|campaignAffinities|raw/i);
  });
});
