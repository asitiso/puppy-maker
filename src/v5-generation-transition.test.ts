import {describe,expect,it} from 'vitest';
import {currentGuardianStatus,initialState,reducer,type GameState} from './game';
import {canStartNextGeneration,emptyLineageState} from './lineage';
import {weekKey} from './weekly-calendar';

describe('V5 next-generation transition',()=>{
  it('requires a mature life and durable completion evidence',()=>{
    expect(canStartNextGeneration({year:2,resolvedEnding:'ending',campaignCompleted:true})).toBe(false);
    expect(canStartNextGeneration({year:3,resolvedEnding:null,campaignCompleted:false})).toBe(false);
    expect(canStartNextGeneration({year:3,resolvedEnding:'ending',campaignCompleted:false})).toBe(true);
    expect(canStartNextGeneration({year:4,resolvedEnding:null,campaignCompleted:true})).toBe(true);
    expect(canStartNextGeneration({year:Number.POSITIVE_INFINITY,resolvedEnding:'ending',campaignCompleted:true})).toBe(false);
  });

  it('starts an explicit next generation while inheriting narrative heritage instead of raw power',()=>{
    const current=weekKey(3,initialState.month,initialState.week);
    const mature={
      ...initialState,
      year:3,
      resolvedEnding:'v3:caretaker:bond:world:career',
      gold:99999,
      gems:999,
      stats:{...initialState.stats,strength:99,magic:97,stress:88,fatigue:77},
      personality:{courage:20,kindness:90,curiosity:30,calmness:40},
      mastery:{hunt:{xp:18},magic:{xp:18},rest:{xp:18},herb:{xp:18}},
      inventory:{...initialState.inventory,star_cookie:99},
      astralRiftEchoes:999,
      guardianSigils:999,
      weeklyLife:{
        focusKey:current,
        focus:'world' as const,
        completedWeekKey:current,
        resolvedEventKeys:[`${current}:guardian_patrol`],
        lastEvent:'guardian_patrol' as const,
      },
      worldHistory:{
        currentFacts:['festival_saved','regional_alliance'] as const,
        inheritedFacts:[],
      },
      lineage:emptyLineageState(),
    } as unknown as GameState;
    const expectedRank=currentGuardianStatus(mature).rank;

    const next=reducer(mature,{type:'START_NEXT_GENERATION'} as never);

    expect(next).not.toBe(mature);
    expect(next.lineage.generation).toBe(2);
    expect(next.lineage.heritageTraits).toEqual(['warm_heart','world_witness']);
    expect(next.lineage.ancestors).toEqual([{
      generation:1,
      yearsLived:3,
      route:null,
      ending:'v3:caretaker:bond:world:career',
      guardianRank:expectedRank,
      personalityKey:'kindness',
      majorWorldFacts:['festival_saved','regional_alliance'],
      heritageTraits:['warm_heart','world_witness'],
    }]);

    expect(next.year).toBe(initialState.year);
    expect(next.month).toBe(initialState.month);
    expect(next.week).toBe(initialState.week);
    expect(next.gold).toBe(initialState.gold);
    expect(next.gems).toBe(initialState.gems);
    expect(next.stats).toEqual(initialState.stats);
    expect(next.mastery).toEqual(initialState.mastery);
    expect(next.inventory).toEqual(initialState.inventory);
    expect(next.astralRiftEchoes).toBe(initialState.astralRiftEchoes);
    expect(next.guardianSigils).toBe(initialState.guardianSigils);
    expect(next.weeklyLife).toEqual(initialState.weeklyLife);
    expect(next.resolvedEnding).toBeUndefined();
  });

  it('is a no-op before eligibility instead of allowing lineage as a progression shortcut',()=>{
    const tooYoung={...initialState,year:2,resolvedEnding:'ending'} as GameState;
    const unfinished={...initialState,year:3,resolvedEnding:undefined} as GameState;
    expect(reducer(tooYoung,{type:'START_NEXT_GENERATION'} as never)).toBe(tooYoung);
    expect(reducer(unfinished,{type:'START_NEXT_GENERATION'} as never)).toBe(unfinished);
  });

  it('cannot duplicate the same ancestor if the generation action is dispatched again after reset',()=>{
    const mature={
      ...initialState,
      year:3,
      resolvedEnding:'ending',
      personality:{...initialState.personality,curiosity:90},
      lineage:emptyLineageState(),
    } as GameState;
    const next=reducer(mature,{type:'START_NEXT_GENERATION'} as never);
    const repeated=reducer(next,{type:'START_NEXT_GENERATION'} as never);
    expect(repeated).toBe(next);
    expect(repeated.lineage.generation).toBe(2);
    expect(repeated.lineage.ancestors).toHaveLength(1);
  });
});
