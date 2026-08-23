import {describe,expect,it} from 'vitest';
import {emptyCharacterBondsState} from './character-bonds';
import {emptyV3PersistentState,hydrateV3PersistentState,type V3PersistentState} from './v3-persistent-state';
import {commitLongNightOutcome,commitWinterEnding,resolveLongNightOutcome,resolveModularEnding} from './campaign-winter-season';
import {prepareNewPossibilityV3State,selectNgPlusUnlocks} from './ngplus-replay';
import type {CharacterId,MainCampaignId} from './campaign-model';
import type {TrueClueId,TruePathEvidenceId} from './legacy-state';
import type {WorldFactId} from './world-history';

const campaignEndingDimension:Record<MainCampaignId,string>={caretaker:'shared_guardianship',pathfinder:'open_horizon',vanguard:'coalition_command',arcanist:'restrained_resonance'};
const campaignCharacter:Record<MainCampaignId,CharacterId>={caretaker:'mira',pathfinder:'kael',vanguard:'rex',arcanist:'selene'};
const campaignMemory:Record<MainCampaignId,string>={caretaker:'mira_winter_victory',pathfinder:'kael_winter_victory',vanguard:'rex_winter_victory',arcanist:'selene_winter_victory'};
const campaignWorldFact:Record<MainCampaignId,WorldFactId>={caretaker:'festival_saved',pathfinder:'ancient_route_opened',vanguard:'regional_alliance',arcanist:'rift_stabilized'};
const campaignTrueClue:Record<MainCampaignId,TrueClueId>={caretaker:'caretaker_life_anomaly',pathfinder:'pathfinder_world_route',vanguard:'vanguard_hidden_conflict_record',arcanist:'arcanist_rift_cycle'};
const campaignEvidence:Record<MainCampaignId,TruePathEvidenceId[]>={
  caretaker:['significant_fail_forward','sanctuary_history'],
  pathfinder:['astral_history'],
  vanguard:['celestial_history'],
  arcanist:['rift_history'],
};

function completeRun(start:V3PersistentState,campaign:MainCampaignId):V3PersistentState{
  const outcome=resolveLongNightOutcome({campaign,outcome:'victory'});
  expect(outcome.accepted).toBe(true);
  if(!outcome.accepted)throw new Error('expected Long Night outcome');
  const longNight=commitLongNightOutcome({...start.campaignRun,phase:'winter',activeCampaign:campaign,seasonMilestones:['autumn_resolved']},outcome);
  expect(longNight.committed).toBe(true);
  if(!longNight.committed)throw new Error('expected Long Night commit');
  const ending=resolveModularEnding({campaignResolution:campaignEndingDimension[campaign],bondResolution:`${campaignCharacter[campaign]}_shared_future`,worldResolution:'survived_together',careerResolution:'guardian_mentor'});
  expect(ending.accepted).toBe(true);
  if(!ending.accepted)throw new Error('expected modular ending');
  const committed=commitWinterEnding({...start,campaignRun:longNight.state},ending.ending,{
    majorWorldOutcomes:[campaignWorldFact[campaign]],
    keyBondMemories:[{characterId:campaignCharacter[campaign],memoryId:campaignMemory[campaign]}],
    trueClues:[campaignTrueClue[campaign]],
    truePathEvidence:campaignEvidence[campaign],
  });
  expect(committed.committed).toBe(true);
  if(!committed.committed)throw new Error('expected Winter ending commit');
  return committed.state;
}

describe('V3 NG+ replay systems',()=>{
  it('starts a new possibility only from a committed completed Winter run',()=>{
    const empty=emptyV3PersistentState();
    expect(prepareNewPossibilityV3State(empty)).toEqual({started:false,state:empty,reason:'not_ready'});
    const started=prepareNewPossibilityV3State(completeRun(empty,'caretaker'));
    expect(started.started).toBe(true);
    if(!started.started)return;
    expect(started.sourceRunNumber).toBe(1);
    expect(started.nextRunNumber).toBe(2);
  });

  it('resets current-run Campaign, Bond and World state while promoting compact Legacy echoes',()=>{
    const started=prepareNewPossibilityV3State(completeRun(emptyV3PersistentState(),'caretaker'));
    expect(started.started).toBe(true);
    if(!started.started)return;
    expect(started.state.campaignRun).toMatchObject({runNumber:2,phase:'spring_exploration',activeCampaign:null,activeRoute:'normal',campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},dangerState:{score:0,behaviors:[]},seasonMilestones:[],majorChoices:{},majorOutcomes:{},failForwardOutcomes:[],claimedCampaignRewards:[],claimedSeasonalObjectives:[]});
    expect(started.state.characterBonds).toEqual(emptyCharacterBondsState());
    expect(started.state.worldHistory.currentFacts).toEqual([]);
    expect(started.state.worldHistory.inheritedFacts).toEqual(['festival_saved']);
    expect(started.state.legacy.completedRuns).toBe(1);
    expect(started.state.legacy.runSummaries).toHaveLength(1);
    expect(started.state.legacy.ngPlusUnlocks).toEqual(['past_life_dialogue','relationship_reunion','world_echo']);
  });

  it('does not duplicate the completed run archive or increment twice on re-entry/reload',()=>{
    const first=prepareNewPossibilityV3State(completeRun(emptyV3PersistentState(),'caretaker'));
    expect(first.started).toBe(true);
    if(!first.started)return;
    const loaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(first.state)));
    expect(loaded).toEqual(first.state);
    expect(prepareNewPossibilityV3State(loaded)).toEqual({started:false,state:loaded,reason:'not_ready'});
  });

  it('withholds fifth_path_candidate until all canonical qualitative evidence exists',()=>{
    let state=emptyV3PersistentState();
    for(const campaign of ['caretaker','pathfinder','vanguard'] as MainCampaignId[]){
      const started=prepareNewPossibilityV3State(completeRun(state,campaign));
      expect(started.started).toBe(true);
      if(!started.started)throw new Error('expected NG+ start');
      state=started.state;
    }
    expect(selectNgPlusUnlocks(state.legacy)).not.toContain('fifth_path_candidate');
    const fourth=prepareNewPossibilityV3State(completeRun(state,'arcanist'));
    expect(fourth.started).toBe(true);
    if(!fourth.started)return;
    expect(selectNgPlusUnlocks(fourth.state.legacy)).toContain('fifth_path_candidate');
  });

  it('remains compact and stable through four completed-run/new-possibility cycles',()=>{
    const campaigns:MainCampaignId[]=['caretaker','pathfinder','vanguard','arcanist'];
    let state=emptyV3PersistentState();
    for(let index=0;index<campaigns.length;index+=1){
      const started=prepareNewPossibilityV3State(completeRun(state,campaigns[index]));
      expect(started.started).toBe(true);
      if(!started.started)throw new Error('expected NG+ start');
      state=hydrateV3PersistentState(JSON.parse(JSON.stringify(started.state)));
      expect(state.campaignRun.runNumber).toBe(index+2);
      expect(state.legacy.completedRuns).toBe(index+1);
      expect(state.legacy.runSummaries.map(item=>item.runNumber)).toEqual(Array.from({length:index+1},(_,i)=>i+1));
      expect(state.campaignRun.claimedSeasonalObjectives).toEqual([]);
      expect(state.worldHistory.currentFacts).toEqual([]);
      expect(state.characterBonds).toEqual(emptyCharacterBondsState());
    }
    expect(state.legacy.completedCampaigns).toEqual(['caretaker','pathfinder','vanguard','arcanist']);
    expect(state.legacy.ngPlusUnlocks).toEqual(['past_life_dialogue','relationship_reunion','world_echo','fifth_path_candidate']);
    expect(state.campaignRun.runNumber).toBe(5);
  });
});
