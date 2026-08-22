import {describe,expect,it} from 'vitest';
import {commitLongNightOutcome,commitWinterEnding,resolveLongNightOutcome,resolveModularEnding} from './campaign-winter-season';
import {prepareNewPossibilityV3State} from './ngplus-replay';
import {emptyV3PersistentState} from './v3-persistent-state';

describe('V3 NG+ semantic unlock sanitation',()=>{
  it('drops a persisted fifth_path_candidate when four-campaign clue eligibility is not satisfied',()=>{
    const initial=emptyV3PersistentState();
    const outcome=resolveLongNightOutcome({campaign:'caretaker',outcome:'victory'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    const longNight=commitLongNightOutcome({
      ...initial.campaignRun,
      phase:'winter',
      activeCampaign:'caretaker',
      seasonMilestones:['autumn_resolved'],
    },outcome);
    expect(longNight.committed).toBe(true);
    if(!longNight.committed)return;

    const ending=resolveModularEnding({
      campaignResolution:'shared_guardianship',
      bondResolution:'mira_shared_future',
      worldResolution:'survived_together',
      careerResolution:'guardian_mentor',
    });
    expect(ending.accepted).toBe(true);
    if(!ending.accepted)return;

    const committed=commitWinterEnding({...initial,campaignRun:longNight.state},ending.ending,{
      majorWorldOutcomes:['festival_saved'],
      keyBondMemories:[{characterId:'mira',memoryId:'mira_winter_victory'}],
      trueClues:['caretaker_life_anomaly'],
    });
    expect(committed.committed).toBe(true);
    if(!committed.committed)return;

    const stale={
      ...committed.state,
      legacy:{...committed.state.legacy,ngPlusUnlocks:['fifth_path_candidate' as const]},
    };
    const started=prepareNewPossibilityV3State(stale);
    expect(started.started).toBe(true);
    if(!started.started)return;
    expect(started.state.legacy.ngPlusUnlocks).toEqual(['past_life_dialogue','relationship_reunion','world_echo']);
  });
});
