import {describe,expect,it} from 'vitest';
import {initialState,reducer,type GameState} from './game';
import type {CampaignId,CampaignRoute} from './campaign-model';

function completedLife(campaign:CampaignId,route:CampaignRoute,endingCampaign:string):GameState{
  const ending=`v3:${endingCampaign}:bond:world:career`;
  return {
    ...initialState,
    year:3,
    resolvedEnding:ending,
    gold:9000,
    gems:700,
    stats:{...initialState.stats,strength:99,magic:88,affection:77},
    personality:{courage:20,kindness:90,curiosity:30,calmness:40},
    worldHistory:{currentFacts:['festival_saved','regional_alliance'],inheritedFacts:[]},
    campaignRun:{
      ...initialState.campaignRun,
      runNumber:2,
      phase:'ending',
      activeCampaign:campaign,
      activeRoute:route,
      seasonMilestones:['winter_resolved','ending_committed'],
      majorOutcomes:{long_night:'victory'},
    },
    legacy:{
      ...initialState.legacy,
      completedRuns:1,
      completedCampaigns:[campaign],
      endingCollection:[ending],
      careerCollection:['career'],
      runSummaries:[{
        runNumber:2,
        campaign,
        route,
        ending,
        career:'career',
        majorWorldOutcomes:['festival_saved'],
        keyBondMemories:[],
        trueClues:[],
      }],
    },
  } as GameState;
}

describe('V5 lineage independence from NG+ and special routes',()=>{
  it('keeps lineage generation and ancestors unchanged when NEW_RUN starts NG+',()=>{
    const completed={
      ...completedLife('caretaker','normal','caretaker'),
      lineage:{
        generation:4,
        heritageTraits:['warm_heart'] as const,
        ancestors:[{
          generation:3,
          yearsLived:4,
          route:'pathfinder' as const,
          ending:'v3:pathfinder:bond:world:career',
          guardianRank:'guardian' as const,
          personalityKey:'curiosity' as const,
          majorWorldFacts:['ancient_route_opened'] as const,
          heritageTraits:['trail_memory'] as const,
        }],
      },
    } as unknown as GameState;

    const next=reducer(completed,{type:'NEW_RUN'});

    expect(next.campaignRun.runNumber).toBe(3);
    expect(next.lineage).toEqual(completed.lineage);
    expect(next.lineage.ancestors).toHaveLength(1);
  });

  it('records a True Path echo as narrative heritage while resetting raw power',()=>{
    const completed=completedLife('true_path','normal','true_path');
    const next=reducer(completed,{type:'START_NEXT_GENERATION'});

    expect(next.lineage.generation).toBe(2);
    expect(next.lineage.heritageTraits).toContain('true_echo');
    expect(next.lineage.ancestors[0]?.route).toBe('true_path');
    expect(next.stats).toEqual(initialState.stats);
    expect(next.gold).toBe(initialState.gold);
    expect(next.gems).toBe(initialState.gems);
    expect(next.campaignRun.runNumber).toBe(initialState.campaignRun.runNumber);
  });

  it('records a Hollow echo without carrying Hollow runtime danger into the child life',()=>{
    const completed={
      ...completedLife('arcanist','hollow','hollow'),
      campaignRun:{
        ...completedLife('arcanist','hollow','hollow').campaignRun,
        dangerState:{score:99,behaviors:['accepted_veyr_power'],evidence:['veyr_power'],finalChoiceResolution:'accepted'},
      },
      personality:{courage:20,kindness:30,curiosity:40,calmness:90},
    } as GameState;

    const next=reducer(completed,{type:'START_NEXT_GENERATION'});

    expect(next.lineage.heritageTraits).toContain('hollow_echo');
    expect(next.lineage.ancestors[0]?.route).toBe('hollow');
    expect(next.campaignRun.activeRoute).toBe('normal');
    expect(next.campaignRun.dangerState.score).toBe(0);
    expect(next.campaignRun.dangerState.behaviors).toEqual([]);
  });
});
