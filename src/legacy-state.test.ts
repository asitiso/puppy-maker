import {describe,expect,it} from 'vitest';
import {emptyLegacyState,hydrateLegacyState} from './legacy-state';

describe('V3 legacy hydration',()=>{
  it('starts with compact empty cross-run state',()=>{
    expect(emptyLegacyState()).toEqual({
      completedRuns:0,completedCampaigns:[],endingCollection:[],careerCollection:[],trueClues:[],legacyWorldFacts:[],relationshipEchoes:{},ngPlusUnlocks:[],runSummaries:[],
    });
  });

  it('hydrates compact run summaries without stale IDs or duplicate run numbers',()=>{
    const state=hydrateLegacyState({
      completedRuns:Infinity,
      completedCampaigns:['vanguard','vanguard','stale'],
      endingCollection:[' guardian ','guardian',''],
      careerCollection:[' captain ','captain',''],
      trueClues:['arcanist_rift_cycle','stale'],
      legacyWorldFacts:['regional_alliance','stale'],
      ngPlusUnlocks:['world_echo','stale'],
      relationshipEchoes:{rex:['rex_first_defeat','rex_first_defeat','stale'],mira:['mira_long_night'],stale:['anything']},
      runSummaries:[
        {runNumber:2,campaign:'vanguard',route:'normal',ending:' guardian ',career:' captain ',majorWorldOutcomes:['regional_alliance','stale'],keyBondMemories:[{characterId:'rex',memoryId:'rex_first_defeat'},{characterId:'rex',memoryId:'stale'}],trueClues:['vanguard_hidden_conflict_record','stale']},
        {runNumber:2,campaign:'arcanist',route:'normal'},
        {runNumber:1,campaign:'stale',route:'normal'},
        {runNumber:3,campaign:'arcanist',route:'forced'},
      ],
    });
    expect(state.completedRuns).toBe(0);
    expect(state.completedCampaigns).toEqual(['vanguard']);
    expect(state.endingCollection).toEqual(['guardian']);
    expect(state.careerCollection).toEqual(['captain']);
    expect(state.trueClues).toEqual(['arcanist_rift_cycle']);
    expect(state.legacyWorldFacts).toEqual(['regional_alliance']);
    expect(state.ngPlusUnlocks).toEqual(['world_echo']);
    expect(state.relationshipEchoes).toEqual({mira:['mira_long_night'],rex:['rex_first_defeat']});
    expect(state.runSummaries.map(item=>item.runNumber)).toEqual([2]);
    expect(state.runSummaries[0]).toMatchObject({campaign:'vanguard',route:'normal',ending:'guardian',career:'captain',majorWorldOutcomes:['regional_alliance'],keyBondMemories:[{characterId:'rex',memoryId:'rex_first_defeat'}],trueClues:['vanguard_hidden_conflict_record']});
  });

  it('sorts accepted run summaries by run number',()=>{
    const state=hydrateLegacyState({runSummaries:[
      {runNumber:4,campaign:'caretaker',route:'normal'},
      {runNumber:1,campaign:'pathfinder',route:'normal'},
    ]});
    expect(state.runSummaries.map(item=>item.runNumber)).toEqual([1,4]);
  });
});
